declare namespace IMasterController {
  interface IDataGetContainerTypesResponse {
    id: string;
    name: string;
    maxHeight: number;
    maxWidth: number;
    maxLength: number;
    maxVolume: number;
    unit: string;
  }
}

export { IMasterController };
