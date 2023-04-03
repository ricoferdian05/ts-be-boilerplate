import { IResponsibility } from '@definitions';
import { IResponsibilityController } from '@v1-definitions';

function formatResponsibilityDetails(
  responsibility: IResponsibility.IDataLean,
): IResponsibilityController.IResponsibilityDetail {
  return {
    id: responsibility._id,
    formattedId: responsibility.formattedId,
    name: responsibility.name,
    accessTypes: responsibility.accessTypes,
    status: responsibility.status,
  };
}

export { formatResponsibilityDetails };
