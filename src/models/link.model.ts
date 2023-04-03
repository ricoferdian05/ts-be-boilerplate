import { Schema, model } from 'mongoose';
import { ApiError } from '@hzn-one/commons';

// import { ILink } from '@definitions';
import { createdSchemaObject, deletedSchemaObject, updatedSchemaObject } from '@models';
import { ILink } from '@server/definitions';

const LinkSchema = new Schema({
    title: { type: String, required: true },
    link: { type: String, required: true },
    ...createdSchemaObject,
    ...updatedSchemaObject,
    ...deletedSchemaObject,
});

// LinkSchema.pre('validate', function (next) {
//     const link = this as unknown as ILink.IDataSchema;

// })

function schemaErrorHandling(error, _doc, next) {
    if(error.name === 'MongoServerError' && error.code === 11000) {
        // code 11000 means there is a duplicate key error
        if (error.keyPattern['title']) next(new ApiError(400, 'Title must be unique', true));
        else if (error.keyPattern['link']) next(new ApiError(400, 'Link must be unique', true));
    }
    next();
}

LinkSchema.post('save', schemaErrorHandling);

const LinkModel = model<ILink.IDataSchema>('Link', LinkSchema);

export { LinkModel };