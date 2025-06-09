import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc, getDoc, updateDoc, addDoc, getDocs, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

export const firestoreService = {
  async registerWithEmailAndPassword(email: string, password: string, name: string): Promise<any> {
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      return userCredential.user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  },

  async loginWithEmailAndPassword(email: string, password: string): Promise<any> {
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return userCredential.user;
    } catch (error) {
      console.error("Error signing in:", error);
      throw error;
    }
  },

  async loginWithGoogle(): Promise<any> {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      return result.user;
    } catch (error) {
      console.error("Error signing in with Google:", error);
      throw error;
    }
  },

  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error signing out:", error);
      throw error;
    }
  },

  async createUserDocument(user: any, additionalData?: any): Promise<void> {
    if (!user) return;

    const userRef = doc(db, 'users', user.uid);
    const snapshot = await getDoc(userRef);

    if (!snapshot.exists()) {
      const createdAt = new Date();
      try {
        await setDoc(userRef, {
          displayName: user.displayName,
          email: user.email,
          photoURL: user.photoURL,
          createdAt,
          ...additionalData
        });
      } catch (error) {
        console.error("Error creating user document:", error);
      }
    }

    return this.getUserDocument(user.uid);
  },

  async getUserDocument(uid: string): Promise<any> {
    if (!uid) return null;

    try {
      const userRef = doc(db, 'users', uid);
      const userSnapshot = await getDoc(userRef);

      if (userSnapshot.exists()) {
        return {
          uid,
          ...userSnapshot.data()
        };
      } else {
        console.log('No such document!');
        return null;
      }
    } catch (error) {
      console.error("Error fetching user document:", error);
      return null;
    }
  },

  async updateUserField(userId: string, field: string, value: any): Promise<void> {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, { [field]: value });
    } catch (error) {
      console.error("Error updating user field:", error);
      throw error;
    }
  },

  async uploadImage(file: File, path: string): Promise<string> {
    try {
      const storageRef = ref(storage, path);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);
      return downloadURL;
    } catch (error) {
      console.error("Error uploading image:", error);
      throw error;
    }
  },

  async createCompany(companyData: any): Promise<string> {
    try {
      const docRef = await addDoc(collection(db, 'companies'), companyData);
      return docRef.id;
    } catch (error) {
      console.error("Error creating company:", error);
      throw error;
    }
  },

  async getCompanyById(companyId: string): Promise<any> {
    try {
      const companyRef = doc(db, 'companies', companyId);
      const companySnapshot = await getDoc(companyRef);

      if (companySnapshot.exists()) {
        return {
          id: companySnapshot.id,
          ...companySnapshot.data()
        };
      } else {
        console.log('No such company!');
        return null;
      }
    } catch (error) {
      console.error("Error fetching company:", error);
      return null;
    }
  },

  async updateCompany(companyId: string, data: any): Promise<void> {
    try {
      const companyRef = doc(db, 'companies', companyId);
      await updateDoc(companyRef, data);
    } catch (error) {
      console.error("Error updating company:", error);
      throw error;
    }
  },

  async sendInvite(email: string, companyId: string, companyName: string): Promise<void> {
    try {
      const inviteData = {
        email,
        companyId,
        companyName,
        role: 'employee',
        invitedBy: 'System',
        sentAt: new Date().toISOString(),
        status: 'pending'
      };

      await addDoc(collection(this.db, 'invites'), inviteData);
    } catch (error) {
      console.error('Error sending invite:', error);
      throw error;
    }
  }

  async acceptInvite(inviteId: string, userId: string, companyId: string): Promise<void> {
    try {
      // Update invite status
      await updateDoc(doc(this.db, 'invites', inviteId), {
        status: 'accepted'
      });

      // Update user with company info
      await updateDoc(doc(this.db, 'users', userId), {
        companyId,
        userType: 'employee'
      });
    } catch (error) {
      console.error('Error accepting invite:', error);
      throw error;
    }
  }

  async updateInviteStatus(inviteId: string, status: string): Promise<void> {
    try {
      await updateDoc(doc(this.db, 'invites', inviteId), {
        status
      });
    } catch (error) {
      console.error('Error updating invite status:', error);
      throw error;
    }
  }

  async getUserInvites(email: string): Promise<any[]> {
    try {
      const q = query(
        collection(this.db, 'invites'),
        where('email', '==', email),
        where('status', '==', 'pending')
      );
      
      const querySnapshot = await getDocs(q);
      return querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error('Error getting user invites:', error);
      return [];
    }
  }
};

export default auth;
