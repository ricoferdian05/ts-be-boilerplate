import { ApiError } from '@hzn-one/commons';
import { GeneralEnum } from '@server/definitions';
import { NextFunction, Request, Response } from 'express';
import httpStatus from 'http-status';
import multer from 'multer';

/**
 * Multer midleware for upload file
 * @param acceptedFormatFile array accepted file format, eg. ['image/jpg']
 * @param maximumFileSize number of maximum file size (in KB)
 * limit.fileSize is number of maximum file size (in Bytes)
 */
const multerInstance = (acceptedFormatFile: GeneralEnum.FileType[], maximumFileSize: number = 10): multer.Multer =>
  multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: maximumFileSize * 1024,
    },
    fileFilter: (_req, file, cb) => {
      if (acceptedFormatFile.includes(file.mimetype as GeneralEnum.FileType)) {
        cb(null, true);
      } else {
        return cb(new ApiError(httpStatus.BAD_REQUEST, `Only ${acceptedFormatFile.toString()} format allowed!`));
      }
    },
  });

export const multerMiddleware =
  (configuredMulter: any): any =>
  (req: Request, res: Response, next: NextFunction) => {
    const onError = (err: any) => {
      let formattedError: ApiError;
      if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading.
        formattedError = new ApiError(httpStatus.BAD_REQUEST, `${err.field} files error ${err.message}`, true);
      } else if (err) {
        // An unknown error occurred when uploading.
        formattedError = new ApiError(httpStatus.BAD_REQUEST, err.message, true);
      }

      next(formattedError);
    };

    configuredMulter(req, res, onError);
  };

export default multerInstance;
