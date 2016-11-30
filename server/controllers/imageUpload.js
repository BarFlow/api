import httpStatus from 'http-status';
import multer from 'multer';
import uuid from 'uuid';
import Upload from 's3-uploader';
import path from 'path';
import APIError from '../helpers/APIError';
import config from '../../config/env';

const storage = multer.diskStorage({
  filename: (req, file, cb) => {
    cb(null, uuid.v4() + path.extname(file.originalname).toLowerCase());
  }
});

const upload = multer({ storage }).single('image');

const client = new Upload('barflow-images', {
  aws: {
    acl: 'public-read',
    region: config.awsRegion,
    accessKeyId: config.awsAccessKeyId,
    secretAccessKey: config.awsSecretAccessKey
  },

  cleanup: {
    versions: true,
    original: true
  },

  original: {
    awsImageAcl: 'public-read'
  },

  versions: [
    {
      maxHeight: 855,
      maxWidth: 685,
      format: 'jpg',
      suffix: '-normal',
      quality: 80,
      background: 'white',
      flatten: true
    },
    {
      maxHeight: 130,
      maxWidth: 130,
      format: 'jpg',
      suffix: '-thumbnail',
      quality: 90,
      background: 'white',
      flatten: true
    }]
});

/**
 * Uploads image to S3.
 * @property {file} req.file - Image to be uploaded.
 * @returns {Images[]}
 */
function s3upload(req, res, next) {
  if (req.file.mimetype.split('/')[0] !== 'image') {
    return next(new APIError('Image has wrong mimetype.', httpStatus.BAD_REQUEST, true));
  }

  client.upload(req.file.path, { awsPath: `${req.user._id}/` }, (err, versions) => {
    if (err) {
      return next(err);
    }
    res.json(versions.map(version => { // eslint-disable-line
      return {
        type: version.suffix ? version.suffix.substring(1) : 'original',
        url: version.url,
        width: version.width,
        height: version.height
      };
    }));
  });
}

export { upload, s3upload };
