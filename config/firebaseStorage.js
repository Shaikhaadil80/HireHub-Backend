const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  try {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      }),
      storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
    });
    console.log('Firebase Admin initialized successfully');
  } catch (error) {
    console.error('Firebase Admin initialization error:', error);
    throw error;
  }
}

// Get the storage bucket
let bucket;
try {
  bucket = admin.storage().bucket();
  console.log('Firebase Storage bucket initialized:', process.env.FIREBASE_STORAGE_BUCKET);
} catch (error) {
  console.error('Firebase Storage bucket initialization error:', error);
  throw error;
}

const uploadToFirebase = async (file, folder = 'property-types') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Validate file
    if (!file.buffer || !file.originalname || !file.mimetype) {
      throw new Error('Invalid file object');
    }

    // Generate unique filename
    const fileExtension = file.originalname.split('.').pop();
    const filename = `${folder}/${uuidv4()}.${fileExtension}`;
    
    console.log('Uploading file to Firebase Storage:', filename);

    // Create file reference in Firebase Storage
    const fileRef = bucket.file(filename);

    // Upload file buffer to Firebase Storage
    await fileRef.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(),
        },
      },
      public: true,
      validation: 'md5',
    });

    console.log('File uploaded successfully, making public...');

    // Make the file public and get download URL
    await fileRef.makePublic();

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    console.log('File is now publicly accessible at:', publicUrl);

    // For now, use the same URL for thumbnail (you can add thumbnail generation logic later)
    const thumbUrl = publicUrl;

    return {
      url: publicUrl,
      thumbUrl: thumbUrl,
      filename: filename,
    };
  } catch (error) {
    console.error('Firebase upload error:', error);
    throw new Error(`Failed to upload image: ${error.message}`);
  }
};

const deleteFromFirebase = async (filename) => {
  try {
    if (!filename) {
      throw new Error('No filename provided');
    }

    const fileRef = bucket.file(filename);
    const [exists] = await fileRef.exists();
    
    if (exists) {
      await fileRef.delete();
      console.log('File deleted from Firebase Storage:', filename);
      return true;
    }
    console.log('File does not exist in Firebase Storage:', filename);
    return false;
  } catch (error) {
    console.error('Firebase delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

// Test function to verify Firebase Storage connection
const testFirebaseStorage = async () => {
  try {
    const [buckets] = await admin.storage().getBuckets();
    console.log('Firebase Storage test successful. Available buckets:', buckets.length);
    return true;
  } catch (error) {
    console.error('Firebase Storage test failed:', error);
    return false;
  }
};

module.exports = {
  uploadToFirebase,
  deleteFromFirebase,
  bucket,
  testFirebaseStorage
};