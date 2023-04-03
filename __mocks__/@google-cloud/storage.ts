export class Storage {
  bucket(name) {
    if (!name) {
      throw new Error('A bucket name is needed to use Cloud Storage.');
    }
    return new Bucket(name);
  }
}

class Bucket {
  name: string;
  constructor(name) {
    this.name = name;
  }

  file(name) {
    // For testing purpose, failing an upload file based on filename
    if (name.match('tasks/delivery-proofs/ERRORID')) {
      throw new Error('Failed file upload');
    }
    return new File(name);
  }
}

class File {
  name: string;

  constructor(name) {
    this.name = name;
  }

  createWriteStream() {
    const streamBuffers = require('stream-buffers');
    const writable = new streamBuffers.WritableStreamBuffer();
    writable.on('finish', () => {});
    return writable;
  }

  delete() {
    return Promise.resolve(true);
  }
}
