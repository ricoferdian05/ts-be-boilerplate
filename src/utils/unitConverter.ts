import { GeneralEnum, FuelEnum } from '@definitions';

export const convertWeightUnit = (from: GeneralEnum.WeightUnit, to: GeneralEnum.WeightUnit, value: number): number => {
  if (from === to) return value;
  else if (from === GeneralEnum.WeightUnit.KG && to === GeneralEnum.WeightUnit.TON) return value / 1000;
  else if (from === GeneralEnum.WeightUnit.TON && to === GeneralEnum.WeightUnit.KG) return value * 1000;
  else throw `converting from ${from} to ${to} is not supported yet`;
};

export const convertVolumeUnit = (from: GeneralEnum.DistanceUnit, to: GeneralEnum.DistanceUnit, value: number) => {
  if (from === to) return value;
  else if (from === GeneralEnum.DistanceUnit.CM && to === GeneralEnum.DistanceUnit.M) return value / 1000000;
  else if (from === GeneralEnum.DistanceUnit.M && to === GeneralEnum.DistanceUnit.CM) return value * 1000000;
  else throw `converting from ${from} to ${to} is not supported yet`;
};

export const convertFuelUnit = (from: FuelEnum.FuelUnit, to: FuelEnum.FuelUnit, value: number): number => {
  if (from === to) return value;
  else if (from === FuelEnum.FuelUnit.GAL && to === FuelEnum.FuelUnit.LTR) return value * 3.785411784;
  else if (from === FuelEnum.FuelUnit.LTR && to === FuelEnum.FuelUnit.GAL) return value * 0.2641720524;
  else throw `converting from ${from} to ${to} is not supported yet`;
};
