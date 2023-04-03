import { Db } from 'mongodb';
import { MigrationInterface } from 'mongo-migrate-ts';
import mongoose from 'mongoose';

import { Mongo } from '@config/mongo';
import { GeneralEnum } from '@definitions';
import { PricingModel } from '@models';

interface IDuplicatePair {
  user: mongoose.ObjectId;
  customerGroup?: mongoose.ObjectId;
  origin: mongoose.ObjectId;
  destination: mongoose.ObjectId;
  serviceType: GeneralEnum.ServiceType;
  duplicatePricingIds: mongoose.ObjectId[];
}

export class RemoveDuplicatePricingOriginDestinationMigration implements MigrationInterface {
  async up(_db: Db): Promise<void> {
    await Mongo.startConnection();

    const [duplicateCityPairs, duplicateDistrictPairs] = await Promise.all([
      PricingModel.aggregate<IDuplicatePair>([
        {
          $match: { pricingType: GeneralEnum.PricingType['3LC'] },
        },
        {
          $group: {
            _id: {
              user: '$user',
              customerGroup: '$customerGroup',
              serviceType: '$serviceType',
              origin: '$originCity.id',
              destination: '$destinationCity.id',
            },
            duplicatePricingIds: {
              $push: '$_id',
            },
          },
        },
        {
          // checks if an origin-destination pair is more than 1
          $match: {
            'duplicatePricingIds.1': { $exists: true },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ['$_id', { duplicatePricingIds: '$duplicatePricingIds' }],
            },
          },
        },
      ]),
      PricingModel.aggregate<IDuplicatePair>([
        {
          $match: { pricingType: GeneralEnum.PricingType.District },
        },
        {
          $group: {
            _id: {
              user: '$user',
              customerGroup: '$customerGroup',
              serviceType: '$serviceType',
              origin: '$originDistrict.id',
              destination: '$destinationDistrict.id',
            },
            duplicatePricingIds: {
              $push: '$_id',
            },
          },
        },
        {
          // checks if an origin-destination pair is more than 1
          $match: {
            'duplicatePricingIds.1': { $exists: true },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              $mergeObjects: ['$_id', { duplicatePricingIds: '$duplicatePricingIds' }],
            },
          },
        },
      ]),
    ]);

    let toBeDeletedPricingIds: mongoose.ObjectId[] = [];
    for (const cityPair of duplicateCityPairs) {
      const deletedPricingIds = cityPair.duplicatePricingIds.slice(1);
      console.info(
        `\nFound duplicate pricing of user ${cityPair.user} for 3LC-${cityPair.serviceType}${
          cityPair.customerGroup ? `-${cityPair.customerGroup}` : ''
        } with origin ${cityPair.origin} and destination ${cityPair.destination}`,
      );
      console.info('To be deleted pricings: ', JSON.stringify(deletedPricingIds));
      toBeDeletedPricingIds = [...toBeDeletedPricingIds, ...deletedPricingIds];
    }

    for (const districtPair of duplicateDistrictPairs) {
      const deletedPricingIds = districtPair.duplicatePricingIds.slice(1);
      console.info(
        `\nFound duplicate pricing of user ${districtPair.user} for District-${districtPair.serviceType}${
          districtPair.customerGroup ? `-${districtPair.customerGroup}` : ''
        } with origin ${districtPair.origin} and destination ${districtPair.destination}`,
      );
      console.info('To be deleted pricings: ', JSON.stringify(deletedPricingIds));
      toBeDeletedPricingIds = [...toBeDeletedPricingIds, ...deletedPricingIds];
    }

    if (toBeDeletedPricingIds.length > 0) {
      await PricingModel.deleteMany({ _id: { $in: toBeDeletedPricingIds } });
      console.info(`\nSucessfully deleted ${toBeDeletedPricingIds.length} pricings.`);
    }

    await mongoose.syncIndexes({ background: false }); // only call syncIndexes if new index is added
  }

  async down(db: Db): Promise<void> {
    // manually drop indexes that ensure origin-destination of pricings is unique
    await db.collection('pricings').dropIndex('user_1_customerGroup_1_originCity.id_1_destinationCity.id_1');

    await db
      .collection('pricings')
      .dropIndex('user_1_customerGroup_1_originCity.id_1_destinationCity.id_1_containerType_1');

    await db.collection('pricings').dropIndex('user_1_customerGroup_1_originDistrict.id_1_destinationDistrict.id_1');

    await db
      .collection('pricings')
      .dropIndex('user_1_customerGroup_1_originDistrict.id_1_destinationDistrict.id_1_containerType_1');
  }
}
