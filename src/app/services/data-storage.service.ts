import { Inject, Injectable, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { FirebaseApp, getApp, getApps, initializeApp } from 'firebase/app';
import { Firestore, deleteDoc, doc, getDoc, getFirestore, setDoc } from 'firebase/firestore/lite';
import { DATA_STORAGE_PROVIDER, FIREBASE_CONFIG } from '../app.settings';

const FIRESTORE_COLLECTION = 'app_state';

@Injectable({
  providedIn: 'root',
})
export class DataStorageService {
  private readonly isBrowser: boolean;
  private readonly provider = DATA_STORAGE_PROVIDER;
  private firebaseApp: FirebaseApp | null = null;
  private firestore: Firestore | null = null;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);

    if (this.isBrowser && this.provider === 'firestore') {
      this.initializeFirestore();
    }
  }

  isClient(): boolean {
    return this.isBrowser;
  }

  async read<T>(key: string, fallback: T): Promise<T> {
    if (!this.isBrowser) return fallback;

    if (this.provider === 'local') {
      return this.readFromLocalStorage(key, fallback);
    }

    return this.readFromFirestore(key, fallback);
  }

  async write<T>(key: string, value: T): Promise<void> {
    if (!this.isBrowser) return;

    if (this.provider === 'local') {
      localStorage.setItem(key, JSON.stringify(value));
      return;
    }

    const firestore = this.getFirestoreInstance();
    if (!firestore) return;

    await setDoc(doc(firestore, FIRESTORE_COLLECTION, key), {
      value,
      updatedAt: new Date().toISOString(),
    });
  }

  async remove(key: string): Promise<void> {
    if (!this.isBrowser) return;

    if (this.provider === 'local') {
      localStorage.removeItem(key);
      return;
    }

    const firestore = this.getFirestoreInstance();
    if (!firestore) return;
    await deleteDoc(doc(firestore, FIRESTORE_COLLECTION, key));
  }

  private readFromLocalStorage<T>(key: string, fallback: T): T {
    try {
      const data = localStorage.getItem(key);
      return data ? (JSON.parse(data) as T) : fallback;
    } catch {
      return fallback;
    }
  }

  private async readFromFirestore<T>(key: string, fallback: T): Promise<T> {
    const firestore = this.getFirestoreInstance();
    if (!firestore) return fallback;

    try {
      const snapshot = await getDoc(doc(firestore, FIRESTORE_COLLECTION, key));
      if (!snapshot.exists()) return fallback;
      const data = snapshot.data() as { value?: T };
      return data.value === undefined ? fallback : data.value;
    } catch {
      return fallback;
    }
  }

  private initializeFirestore(): void {
    if (getApps().length === 0) {
      this.firebaseApp = initializeApp(FIREBASE_CONFIG);
    } else {
      this.firebaseApp = getApp();
    }

    this.firestore = getFirestore(this.firebaseApp);
  }

  private getFirestoreInstance(): Firestore | null {
    if (!this.isBrowser || this.provider !== 'firestore') return null;
    if (!this.firestore) {
      this.initializeFirestore();
    }
    return this.firestore;
  }
}
