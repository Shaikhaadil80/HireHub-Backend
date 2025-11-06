// // const admin = require('firebase-admin');
// // const User = require('../models/User');

// // // Initialize Firebase Admin (you'll need to set up Firebase Admin SDK)
// // const serviceAccount = require('../config/firebase-service-account.json');

// // if (!admin.apps.length) {
// //   admin.initializeApp({
// //     credential: admin.credential.cert(serviceAccount)
// //   });
// // }

// // const verifyFirebaseToken = async (req, res, next) => {
// //   try {
// //     let token;

// //     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
// //       token = req.headers.authorization.split(' ')[1];
// //     }

// //     if (!token) {
// //       return res.status(401).json({
// //         success: false,
// //         error: 'No Firebase ID token provided'
// //       });
// //     }

// //     // Verify Firebase token
// //     const decodedToken = await admin.auth().verifyIdToken(token);
// //     req.firebaseUser = decodedToken;

// //     // Find or create user in our database
// //     let user = await User.findOne({ uid: decodedToken.uid });
    
// //     if (!user) {
// //       // User doesn't exist in our DB yet, but we'll allow the request
// //       // The frontend should call createUser after Firebase auth
// //       req.user = null;
// //     } else {
// //       req.user = user;
// //     }

// //     next();
// //   } catch (error) {
// //     console.error('Firebase auth error:', error);
// //     return res.status(401).json({
// //       success: false,
// //       error: 'Invalid or expired Firebase token'
// //     });
// //   }
// // };

// // const requireUserInDB = async (req, res, next) => {
// //   if (!req.user) {
// //     return res.status(404).json({
// //       success: false,
// //       error: 'User profile not found. Please complete registration.'
// //     });
// //   }
// //   next();
// // };

// // module.exports = {
// //   verifyFirebaseToken,
// //   requireUserInDB
// // };





// const admin = require('firebase-admin');
// const User = require('../models/User');

// // Initialize Firebase Admin using environment variables
// if (!admin.apps.length) {
//   admin.initializeApp({
//     credential: admin.credential.cert({
//       projectId: process.env.FIREBASE_PROJECT_ID,
//       privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
//       clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
//     })
//   });
// }

// const verifyFirebaseToken = async (req, res, next) => {
//   try {
//     let token;

//     if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
//       token = req.headers.authorization.split(' ')[1];
//     }

//     if (!token) {
//       return res.status(401).json({
//         success: false,
//         error: `No Firebase ID token provided \n ${req.headers.authorization} `
//       });
//     }

//     // Verify Firebase token
//     const decodedToken = await admin.auth().verifyIdToken(token);
//     req.firebaseUser = decodedToken;

//     // Find user in our database
//     let user = await User.findOne({ uid: decodedToken.uid });
    
//     if (!user) {
//       req.user = null;
//     } else {
//       req.user = user;
//     }

//     next();
//   } catch (error) {
//     console.error('Firebase auth error:', error);
    
//     // Handle specific Firebase errors
//     if (error.code === 'auth/id-token-expired') {
//       return res.status(401).json({
//         success: false,
//         error: 'Token expired. Please login again.'
//       });
//     }
    
//     if (error.code === 'auth/id-token-revoked') {
//       return res.status(401).json({
//         success: false,
//         error: 'Token revoked. Please login again.'
//       });
//     }

//     return res.status(401).json({
//       success: false,
//       error: 'Invalid or expired Firebase token'
//     });
//   }
// };

// const requireUserInDB = async (req, res, next) => {
//   if (!req.user) {
//     return res.status(404).json({
//       success: false,
//       error: 'User profile not found. Please complete registration.'
//     });
//   }
//   next();
// };

// // Optional: Get Firebase user details
// const getFirebaseUser = async (uid) => {
//   try {
//     const userRecord = await admin.auth().getUser(uid);
//     return userRecord;
//   } catch (error) {
//     console.error('Error getting Firebase user:', error);
//     return null;
//   }
// };

// module.exports = {
//   verifyFirebaseToken,
//   requireUserInDB,
//   getFirebaseUser
// };

const admin = require('firebase-admin');
const User = require('../models/User');

// Initialize Firebase Admin
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    })
  });
}

const verifyFirebaseToken = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        error: 'No Firebase ID token provided'
      });
    }

    // Verify Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    // Set firebase user data
    req.firebaseUser = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified || false
    };

    // Find user in our database
    let user = await User.findOne({ uid: decodedToken.uid });
    
    if (user) {
      req.user = {
        id: user._id,
        uid: user.uid,
        email: user.email,
        userName: user.userName,
        userType: user.userType,
        isActive: user.isActive
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    console.error('Firebase auth error:', error);
    
    if (error.code === 'auth/id-token-expired') {
      return res.status(401).json({
        success: false,
        error: 'Token expired. Please login again.'
      });
    }
    
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired Firebase token'
    });
  }
};

const requireUserInDB = async (req, res, next) => {
  if (!req.user) {
    return res.status(404).json({
      success: false,
      error: 'User profile not found. Please complete registration.'
    });
  }
  
  if (!req.user.isActive) {
    return res.status(401).json({
      success: false,
      error: 'User account is deactivated.'
    });
  }
  
  next();
};

// Enhanced authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        error: `User role ${req.user.userType} is not authorized to access this route`
      });
    }
    next();
  };
};

module.exports = {
  verifyFirebaseToken,
  requireUserInDB,
  authorize
};