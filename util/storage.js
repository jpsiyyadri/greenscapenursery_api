/**
 * TODO(developer): Uncomment the following line before running the sample.
 */
// const bucketName = 'Name of a bucket, e.g. my-bucket';
// const storageClass = 'Name of a storage class, e.g. coldline';
// const location = 'Name of a location, e.g. ASIA';

// Imports the Google Cloud client library
const {Storage} = require('@google-cloud/storage');

// Creates a client
const storage = new Storage();

async function createBucketWithStorageClassAndLocation() {
  // For default values see: https://cloud.google.com/storage/docs/locations and
  // https://cloud.google.com/storage/docs/storage-classes

  const [bucket] = await storage.createBucket(bucketName, {
    location,
    [storageClass]: true,
  });

  console.log(
    `${bucket.name} created with ${storageClass} class in ${location}.`
  );
}

createBucketWithStorageClassAndLocation();
