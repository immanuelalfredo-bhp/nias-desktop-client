import { ipcMain } from 'electron';
import { variant, attribute, common } from '@nias/shared';
import { logger } from '@nias/shared/server';
import { UserDatabase } from '../../db/database';
import { createAuditLog } from '../system/audit';

export function registerVariantGeneratorIpcHandlers(userDb: UserDatabase, userId: string): void {
  ipcMain.handle('variant-generator:run', async (_event): Promise<common.SuccessResponse> => {
    try {
      // Generate variant records for components to be used in assemblies
      const component = generateComponents(userDb);

      if (!component) {
        logger.info({ scope: 'variant-record' }, 'No component records generated');
        return { success: true, message: 'No component records generated' };
      }

      userDb.variant.transaction(() => {
        for (const record of component.variantRecords) {
          userDb.variant.upsert(record);
        }
      });

      logger.info(
        { scope: 'variant-record', variantRecordCount: component.variantRecords.length },
        'Upserted component records',
      );

      userDb.dimensionValueMap.transaction(() => {
        for (const record of component.dimensionValueMapRecords) {
          userDb.dimensionValueMap.upsert(record);
        }
      });

      logger.info(
        { scope: 'variant-record', dimensionValueMapCount: component.dimensionValueMapRecords.length },
        'Upserted component value map records',
      );
      
      // // Generate component map records for assemblies
      // const assembly = generateAssemblies(userDb);

      // if (!assembly) {
      //   logger.info({ scope: 'variant-record' }, 'No assembly records generated');
      //   return { success: true, message: 'No assembly records generated' };
      // }

      // userDb.variant.transaction(() => {
      //   for (const record of assembly.variantRecords) {
      //     userDb.variant.upsert(record);
      //   }
      // });

      // logger.info(
      //   { scope: 'variant-record', variantRecordCount: assembly.variantRecords.length },
      //   'Upserted assembly records',
      // );

      // userDb.dimensionValueMap.transaction(() => {
      //   for (const record of assembly.dimensionValueMapRecords) {
      //     userDb.dimensionValueMap.upsert(record);
      //   }
      // });

      // logger.info(
      //   { scope: 'variant-record', dimensionValueMapCount: assembly.dimensionValueMapRecords.length },
      //   'Upserted assembly value map records',
      // );

      // userDb.componentMap.transaction(() => {
      //   for (const record of assembly.componentMapRecords) {
      //     userDb.componentMap.upsert(record);
      //   }
      // });

      // logger.info(
      //   { scope: 'variant-record', componentMapCount: assembly.componentMapRecords.length },
      //   'Upserted assembly component map records',
      // );

      createAuditLog(userDb, userId, {
        action: 'generate',
        tableName: 'variant_records',
        recordId: '',
        recordName: '',
      });

      return { success: true, message: 'Variant records generated successfully' };
    } catch (error) {
      logger.error(
        {
          scope: 'variant-record',
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to generate variant records',
      );
      return { success: false, message: 'Failed to generate variant records' };
    }
  });
}

function generateComponents(userDb: UserDatabase) {
  const generationRules = userDb.generationRules.listDirtyComponents();
  if (generationRules.length === 0) {
    logger.info(
      { scope: 'variant-record', generationRuleCount: generationRules.length },
      'No dirty component generation rules found, skipping variant record generation',
    );
    return;
  }

  // Accumulators for database insertion across all rules and rulesets
  const allVariantRecords: variant.VariantRecord[] = [];
  const allDimensionValueMapRecords: variant.DimensionValueMap[] = [];

  for (const record of generationRules) {
    let rules;
    try {
      rules = typeof record.rules === 'string' ? JSON.parse(record.rules) : record.rules;
      logger.info(
        { scope: 'variant-record', generationRuleId: record.id, rules },
        'Processing generation rule',
      );
    } catch (error) {
      logger.error(
        {
          scope: 'variant-record',
          generationRuleId: record.id,
          errorMessage: (error as Error).message,
          errorStack: (error as Error).stack,
          rawError: error,
        },
        'Failed to parse generation rule',
      );
      continue;
    }

    if (!rules || !Array.isArray(rules.rulesets) || rules.rulesets.length === 0) {
      logger.info(
        { scope: 'variant-record', generationRuleId: record.id },
        'No valid rulesets found for generation rule, skipping',
      );
      continue;
    }

    for (const ruleset of rules.rulesets) {
      const dimensions = ruleset.dimensions;
      const exclude = ruleset.exclude;

      const dimensionKeys = Object.keys(dimensions);
      const dimensionPool: Record<string, attribute.DimensionValue[]> = {};

      let hasMissingDimensions = false;

      for (const dimensionName of dimensionKeys) {
        const condition = dimensions[dimensionName];
        const dimensionValues = resolveDimensionValues(userDb, dimensionName, condition);

        if (dimensionValues.length === 0) {
          logger.warn(
            { scope: 'variant-record', generationRuleId: record.id, dimensionName },
            'No dimension values found for dimension, skipping ruleset',
          );
          hasMissingDimensions = true;
          break;
        }
        dimensionPool[dimensionName] = dimensionValues;
      }
      
      if (hasMissingDimensions) {
        logger.warn(
          { scope: 'variant-record', generationRuleId: record.id },
          'Skipping ruleset due to missing dimensions',
        );
        continue;
      }

      const keys = Object.keys(dimensionPool);
      const values = Object.values(dimensionPool);

      const combinations = values.reduce(
        (acc, curr) => {
          return acc.flatMap((accItem) => curr.map((currentItem) => [...accItem, currentItem]));
        },
        [[]] as attribute.DimensionValue[][],
      );

      const variantConfigurations = combinations.map((combination) => {
        const config: Record<string, attribute.DimensionValue> = {};
        keys.forEach((key, index) => {
          config[key] = combination[index]!;
        });
        return config;
      });

      let filteredConfigurations = variantConfigurations;

      if (exclude && Array.isArray(exclude) && exclude.length > 0) {
        filteredConfigurations = variantConfigurations.filter((config) => {
          for (const rule of exclude) {
            let isExcluded = true;
            for (const [key, value] of Object.entries(rule)) {
              const dimensionValue = config[key]?.skuCode || config[key]?.numericValue;
              if (dimensionValue !== value) {
                isExcluded = false;
                break;
              }
            }
            if (isExcluded) {
              return false;
            }
          }
          return true;
        });
      }

      const variantData = filteredConfigurations.map((config) => {
        const dimensionIds = keys.map((key) => config[key]!.id).sort();
        const namespace = 'variant';
        const name = [
          record.itemId,
          record.categoryId,
          record.modeId,
          record.uomId,
          record.brandId,
          ...dimensionIds,
        ].join('-');
        const uuid = generateUuidV5(name, namespace);

        const itemSkuCode = userDb.item.getById(record.itemId)?.skuCode;
        const brandSkuCode = userDb.brand.getById(record.brandId)?.skuCode;

        // Get the prefix and suffix parts from the config and join them without a dash
        const prefixSuffixPart = keys
          .filter((key) => {
            const pos = userDb.dimension.getByNorm(key)?.position;
            return pos === 'prefix' || pos === 'suffix';
          })
          .map((key) => config[key]?.skuCode)
          .filter(Boolean)
          .join('');

        // Get the dimension parts to join them with the appropriate delimiter later
        const dimensionParts = keys
          .filter((key) => userDb.dimension.getByNorm(key)?.position === 'dimensions')
          .map((key) => config[key]?.name || config[key]?.skuCode)
          .filter(Boolean);

        const skuCode = [
          itemSkuCode,
          prefixSuffixPart,
          ...keys
            .filter((key) => userDb.dimension.getByNorm(key)?.position === 'dimensions')
            .map((key) => config[key]?.skuCode)
            .filter(Boolean),
          ...keys
            .filter((key) => userDb.dimension.getByNorm(key)?.position === 'end')
            .map((key) => config[key]?.skuCode)
            .filter(Boolean),
          brandSkuCode,
        ].join('-');

        const baseItemName = userDb.item.getById(record.itemId)?.baseName;
        const delimiterType = userDb.item.getById(record.itemId)?.delimiterType;

        let formattedDimensions = '';

        if (delimiterType === 'pipe' && dimensionParts.length > 0) {
          // Outputs: | a | b | c |
          formattedDimensions = `| ${dimensionParts.join(' | ')} |`;
        } else if (delimiterType === 'cross') {
          // Outputs: a x b x c
          formattedDimensions = dimensionParts.join(' x ');
        }

        // 3. Assemble the full description
        const description = [
          ...keys
            .filter((key) => userDb.dimension.getByNorm(key)?.position === 'prefix')
            .map((key) => config[key]?.name || config[key]?.skuCode)
            .filter(Boolean),
          baseItemName,
          ...keys
            .filter((key) => userDb.dimension.getByNorm(key)?.position === 'suffix')
            .map((key) => config[key]?.name || config[key]?.skuCode)
            .filter(Boolean),
          formattedDimensions,
          ...keys
            .filter((key) => userDb.dimension.getByNorm(key)?.position === 'end')
            .map((key) => config[key]?.name || config[key]?.skuCode)
            .filter(Boolean),
        ]
          .filter(Boolean)
          .join(' ');

        const variantRecord: variant.VariantRecord = {
          id: uuid,
          itemId: record.itemId,
          categoryId: record.categoryId,
          brandId: record.brandId,
          modeId: record.modeId,
          uomId: record.uomId,
          skuCode: skuCode,
          description: description,
          details: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          deletedAt: null,
          isSynced: false,
          syncVersion: 0,
        };

        const dimensionValueMapRecords: variant.DimensionValueMap[] = keys.map((key) => {
          return {
            id: crypto.randomUUID(),
            variantId: variantRecord.id,
            dimensionValueId: config[key]!.id,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            deletedAt: null,
            isSynced: false,
            syncVersion: 0,
          };
        });

        return { variantRecord, dimensionValueMapRecords };
      });
      for (const item of variantData) {
        allVariantRecords.push(item.variantRecord);
        allDimensionValueMapRecords.push(...item.dimensionValueMapRecords);
      }
    }
  }

  return {
    variantRecords: allVariantRecords,
    dimensionValueMapRecords: allDimensionValueMapRecords,
  };
}

// function generateAssemblies(userDb: UserDatabase) {
//   const generationRules = userDb.generationRules.listDirtyAssemblies();
//   if (generationRules.length === 0) {
//     logger.info(
//       { scope: 'variant-record', generationRuleCount: generationRules.length },
//       'No dirty assembly generation rules found, skipping variant record generation',
//     );
//     return;
//   }

//   // Accumulators for database insertion across all rules and rulesets
//   const allVariantRecords: variant.VariantRecord[] = [];
//   const allDimensionValueMapRecords: variant.DimensionValueMap[] = [];
//   const allComponentMapRecords: variant.ComponentMap[] = [];

//   for (const record of generationRules) {
//     let rules;
//     try {
//       rules = typeof record.rules === 'string' ? JSON.parse(record.rules) : record.rules;
//       logger.info(
//         { scope: 'variant-record', generationRuleId: record.id, rules },
//         'Processing generation rule',
//       );
//     } catch (error) {
//       logger.error(
//         {
//           scope: 'variant-record',
//           generationRuleId: record.id,
//           errorMessage: (error as Error).message,
//           errorStack: (error as Error).stack,
//           rawError: error,
//         },
//         'Failed to parse generation rule',
//       );
//       continue;
//     }

//     if (!rules || !Array.isArray(rules.rulesets) || rules.rulesets.length === 0) {
//       logger.info(
//         { scope: 'variant-record', generationRuleId: record.id },
//         'No valid rulesets found for generation rule, skipping',
//       );
//       continue;
//     }

//     for (const ruleset of rules.rulesets) {
//       const dimensions = ruleset.dimensions;
//       const exclude = ruleset.exclude;
//       const components = ruleset.components;

//       const dimensionKeys = Object.keys(dimensions);
//       const dimensionPool: Record<string, attribute.DimensionValue[]> = {};

//       let hasMissingDimensions = false;

//       for (const dimensionName of dimensionKeys) {
//         const condition = dimensions[dimensionName];
//         const dimensionValues = resolveDimensionValues(userDb, dimensionName, condition);

//         if (dimensionValues.length === 0) {
//           logger.warn(
//             { scope: 'variant-record', generationRuleId: record.id, dimensionName },
//             'No dimension values found for dimension, skipping ruleset',
//           );
//           hasMissingDimensions = true;
//           break;
//         }
//         dimensionPool[dimensionName] = dimensionValues;
//       }
      
//       if (hasMissingDimensions) {
//         logger.warn(
//           { scope: 'variant-record', generationRuleId: record.id },
//           'Skipping ruleset due to missing dimensions',
//         );
//         continue;
//       }

//       const keys = Object.keys(dimensionPool);
//       const values = Object.values(dimensionPool);

//       const combinations = values.reduce(
//         (acc, curr) => {
//           return acc.flatMap((accItem) => curr.map((currentItem) => [...accItem, currentItem]));
//         },
//         [[]] as attribute.DimensionValue[][],
//       );

//       const variantConfigurations = combinations.map((combination) => {
//         const config: Record<string, attribute.DimensionValue> = {};
//         keys.forEach((key, index) => {
//           config[key] = combination[index]!;
//         });
//         return config;
//       });

//       let filteredConfigurations = variantConfigurations;

//       if (exclude && Array.isArray(exclude) && exclude.length > 0) {
//         filteredConfigurations = variantConfigurations.filter((config) => {
//           for (const rule of exclude) {
//             let isExcluded = true;
//             for (const [key, value] of Object.entries(rule)) {
//               const dimensionValue = config[key]?.skuCode || config[key]?.numericValue;
//               if (dimensionValue !== value) {
//                 isExcluded = false;
//                 break;
//               }
//             }
//             if (isExcluded) {
//               return false;
//             }
//           }
//           return true;
//         });
//       }

//       const variantData = filteredConfigurations.map((config) => {
//         const dimensionIds = keys.map((key) => config[key]!.id).sort();
//         const namespace = 'variant';
//         const name = [
//           record.itemId,
//           record.categoryId,
//           record.modeId,
//           record.uomId,
//           record.brandId,
//           ...dimensionIds,
//         ].join('-');
//         const uuid = generateUuidV5(name, namespace);

//         const itemSkuCode = userDb.item.getById(record.itemId)?.skuCode;
//         const brandSkuCode = userDb.brand.getById(record.brandId)?.skuCode;

//         // Get the prefix and suffix parts from the config and join them without a dash
//         const prefixSuffixPart = keys
//           .filter((key) => {
//             const pos = userDb.dimension.getByNorm(key)?.position;
//             return pos === 'prefix' || pos === 'suffix';
//           })
//           .map((key) => config[key]?.skuCode)
//           .filter(Boolean)
//           .join('');

//         // Get the dimension parts to join them with the appropriate delimiter later
//         const dimensionParts = keys
//           .filter((key) => userDb.dimension.getByNorm(key)?.position === 'dimensions')
//           .map((key) => config[key]?.name || config[key]?.skuCode)
//           .filter(Boolean);

//         const skuCode = [
//           itemSkuCode,
//           prefixSuffixPart,
//           ...keys
//             .filter((key) => userDb.dimension.getByNorm(key)?.position === 'dimensions')
//             .map((key) => config[key]?.skuCode)
//             .filter(Boolean),
//           ...keys
//             .filter((key) => userDb.dimension.getByNorm(key)?.position === 'end')
//             .map((key) => config[key]?.skuCode)
//             .filter(Boolean),
//           brandSkuCode,
//         ].join('-');

//         const baseItemName = userDb.item.getById(record.itemId)?.baseName;
//         const delimiterType = userDb.item.getById(record.itemId)?.delimiterType;

//         let formattedDimensions = '';

//         if (delimiterType === 'pipe' && dimensionParts.length > 0) {
//           // Outputs: | a | b | c |
//           formattedDimensions = `| ${dimensionParts.join(' | ')} |`;
//         } else if (delimiterType === 'cross') {
//           // Outputs: a x b x c
//           formattedDimensions = dimensionParts.join(' x ');
//         }

//         // 3. Assemble the full description
//         const description = [
//           ...keys
//             .filter((key) => userDb.dimension.getByNorm(key)?.position === 'prefix')
//             .map((key) => config[key]?.name || config[key]?.skuCode)
//             .filter(Boolean),
//           baseItemName,
//           ...keys
//             .filter((key) => userDb.dimension.getByNorm(key)?.position === 'suffix')
//             .map((key) => config[key]?.name || config[key]?.skuCode)
//             .filter(Boolean),
//           formattedDimensions,
//           ...keys
//             .filter((key) => userDb.dimension.getByNorm(key)?.position === 'end')
//             .map((key) => config[key]?.name || config[key]?.skuCode)
//             .filter(Boolean),
//         ]
//           .filter(Boolean)
//           .join(' ');

//         const variantRecord: variant.VariantRecord = {
//           id: uuid,
//           itemId: record.itemId,
//           categoryId: record.categoryId,
//           brandId: record.brandId,
//           modeId: record.modeId,
//           uomId: record.uomId,
//           skuCode: skuCode,
//           description: description,
//           details: null,
//           createdAt: new Date().toISOString(),
//           updatedAt: new Date().toISOString(),
//           deletedAt: null,
//           isSynced: false,
//           syncVersion: 0,
//         };

//         const dimensionValueMapRecords: variant.DimensionValueMap[] = keys.map((key) => {
//           return {
//             id: crypto.randomUUID(),
//             variantId: variantRecord.id,
//             dimensionValueId: config[key]!.id,
//             createdAt: new Date().toISOString(),
//             updatedAt: new Date().toISOString(),
//             deletedAt: null,
//             isSynced: false,
//             syncVersion: 0,
//           };
//         });

//         return { variantRecord, dimensionValueMapRecords, componentMapRecords };
//       });
//       for (const item of variantData) {
//         allVariantRecords.push(item.variantRecord);
//         allDimensionValueMapRecords.push(...item.dimensionValueMapRecords);
//         allComponentMapRecords.push(...item.componentMapRecords);
//       }
//     }
//   }

//   return {
//     variantRecords: allVariantRecords,
//     dimensionValueMapRecords: allDimensionValueMapRecords,
//     componentMapRecords: allComponentMapRecords,
//   };
// }

function resolveDimensionValues(
  userDb: UserDatabase,
  dimensionName: string,
  condition: any,
): attribute.DimensionValue[] {
  const dimensionId = userDb.dimension.getByNorm(dimensionName)?.id;

  if (!dimensionId) {
    logger.warn(
      { scope: 'variant-record', dimensionName },
      'Dimension not found for generation rule, skipping',
    );
    return [];
  }

  if (condition.anyOf && Array.isArray(condition.anyOf) && condition.anyOf.length > 0) {
    let combinedResults: any[] = [];
    for (const subcondition of condition.anyOf) {
      const results = resolveDimensionValues(userDb, dimensionName, subcondition);
      combinedResults = combinedResults.concat(results);
    }
    logger.info(
      { scope: 'variant-record', dimensionName, combinedResultsCount: combinedResults.length },
      'Resolved dimension values for anyOf condition',
    );
    return combinedResults;
  }

  if (condition.between && Array.isArray(condition.between) && condition.between.length === 2) {
    logger.info(
      { scope: 'variant-record', dimensionName, betweenRange: condition.between },
      'Resolving dimension values for between condition',
    );
    return userDb.dimensionValue.getBetween(
      dimensionId,
      condition.between[0],
      condition.between[1],
    );
  }

  if (condition.include && Array.isArray(condition.include) && condition.include.length > 0) {
    logger.info(
      { scope: 'variant-record', dimensionName, includeValues: condition.include },
      'Resolving dimension values for include condition',
    );
    return userDb.dimensionValue.getInclude(dimensionId, condition.include);
  }

  if (condition.is !== undefined) {
    const result = userDb.dimensionValue.getIs(dimensionId, condition.is);
    logger.info(
      { scope: 'variant-record', dimensionName, isValue: condition.is, resultFound: !!result },
      'Resolving dimension value for is condition',
    );
    return result ? [result] : [];
  }

  // If no valid condition is found, return an empty array
  logger.warn(
    { scope: 'variant-record', dimensionName, condition },
    'No valid condition found for dimension, returning empty array',
  );
  return [];
}

// function resolveComponentVariant(
//   userDb: UserDatabase,
//   condition: {
//     itemId: string;
//     inheritDimensions?: string[];
//     dimensions?: Record<string, any>;
//   },
//   parentDimensionValues: Record<string, attribute.DimensionValue>,
// ): string | null {
//   const targetDimensionValueIds: string[] = [];

//   if (condition.inheritDimensions && Array.isArray(condition.inheritDimensions)) {
//     for (const dimensionName of condition.inheritDimensions) {
//       const parentValue = parentDimensionValues[dimensionName];
//       if (parentValue) {
//         targetDimensionValueIds.push(parentValue.id);
//       } else {
//         logger.warn(
//           { scope: 'variant-record', dimensionName },
//           'Inherited dimension value not found in parent, skipping component variant resolution',
//         );
//         return null;
//       }
//     }
//   }

//   if (condition.dimensions) {
//     for (const [dimensionName, dimensionCondition] of Object.entries(condition.dimensions)) {
//       const resolvedValues = resolveDimensionValues(userDb, dimensionName, dimensionCondition);
//       combinedResults = combinedResults.concat(resolvedValues);
//     }
//   }

//   const dimensionId = userDb.dimension.getByNorm(dimensionName)?.id;

//   if (!dimensionId) {
//     logger.warn(
//       { scope: 'variant-record', dimensionName },
//       'Dimension not found for generation rule, skipping',
//     );
//     return [];
//   }

//   if (condition.anyOf && Array.isArray(condition.anyOf) && condition.anyOf.length > 0) {
//     let combinedResults: any[] = [];
//     for (const subcondition of condition.anyOf) {
//       const results = resolveDimensionValues(userDb, dimensionName, subcondition);
//       combinedResults = combinedResults.concat(results);
//     }
//     logger.info(
//       { scope: 'variant-record', dimensionName, combinedResultsCount: combinedResults.length },
//       'Resolved dimension values for anyOf condition',
//     );
//     return combinedResults;
//   }

//   if (condition.between && Array.isArray(condition.between) && condition.between.length === 2) {
//     logger.info(
//       { scope: 'variant-record', dimensionName, betweenRange: condition.between },
//       'Resolving dimension values for between condition',
//     );
//     return userDb.dimensionValue.getBetween(
//       dimensionId,
//       condition.between[0],
//       condition.between[1],
//     );
//   }

//   if (condition.include && Array.isArray(condition.include) && condition.include.length > 0) {
//     logger.info(
//       { scope: 'variant-record', dimensionName, includeValues: condition.include },
//       'Resolving dimension values for include condition',
//     );
//     return userDb.dimensionValue.getInclude(dimensionId, condition.include);
//   }

//   if (condition.is !== undefined) {
//     const result = userDb.dimensionValue.getIs(dimensionId, condition.is);
//     logger.info(
//       { scope: 'variant-record', dimensionName, isValue: condition.is, resultFound: !!result },
//       'Resolving dimension value for is condition',
//     );
//     return result ? [result] : [];
//   }

//   // If no valid condition is found, return an empty array
//   logger.warn(
//     { scope: 'variant-record', dimensionName, condition },
//     'No valid condition found for dimension, returning empty array',
//   );
//   return [];
// }

function generateUuidV5(name: string, namespace: string): string {
  const crypto = require('crypto');

  // Compute SHA-1 hash of namespace + name directly into a buffer
  const buffer = crypto.hash(
    'sha1',
    Buffer.concat([Buffer.from(namespace, 'utf8'), Buffer.from(name, 'utf8')]),
    'buffer',
  );

  // Set RFC version (5) and variant bits
  buffer[6] = (buffer[6] & 0x0f) | 0x50;
  buffer[8] = (buffer[8] & 0x3f) | 0x80;

  const hex = buffer.toString('hex');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}


// RULESET EXAMPLE
// {
//   "rulesets": [
//     {
//       "id": "ruleset-001",
//       "dimensions": {
//         "material": { "include": ["EP", "HDG"] },
//         "width": { "anyOf": [{ "between": [100, 400] }, { "between": [500, 1000] }] },
//         "height": { "is": 50 }
//       },
//       "exclude": [
//         { "material": "EP", "width": 200, "height": 50 }
//       ],
//       "components": [
//         {
//           "itemId": "uuid-of-item-1",
//           "quantity": 2,
//           "inheritDimensions": ["material", "width"],
//           "dimensions": {
//             "height": { "is": 50 }
//           }
//         }
//       ]
//     },
//     {
//       "id": "ruleset-002",
//       "dimensions": {
//         "material": { "include": ["EP", "HDG"] },
//         "width": { "anyOf": [{ "between": [100, 400] }, { "between": [500, 1000] }] },
//         "height": { "is": 100 }
//       },
//       "components": []
//     }
//   ]
// }