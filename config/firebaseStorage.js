const admin = require('firebase-admin');
const { v4: uuidv4 } = require('uuid');

// Initialize Firebase Admin if not already done
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    }),
    storageBucket: process.env.FIREBASE_STORAGE_BUCKET, // your-app.appspot.com
  });
}

const bucket = admin.storage().bucket();

const uploadToFirebase = async (file, folder = 'property-types') => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    // Generate unique filename
    const filename = `${folder}/${uuidv4()}-${file.originalname}`;
    
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

    // Make the file public and get download URL
    await fileRef.makePublic();

    // Generate public URL
    const publicUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`;

    // Generate thumbnail URL (same image for now, you can add thumbnail generation logic)
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
    const fileRef = bucket.file(filename);
    const [exists] = await fileRef.exists();
    
    if (exists) {
      await fileRef.delete();
      return true;
    }
    return false;
  } catch (error) {
    console.error('Firebase delete error:', error);
    throw new Error(`Failed to delete image: ${error.message}`);
  }
};

module.exports = {
  uploadToFirebase,
  deleteFromFirebase,
  bucket
};