import { Injectable, OnModuleInit } from '@nestjs/common';
import { readFileSync } from 'node:fs';
import { App, cert, initializeApp } from 'firebase-admin/app';
import { Firestore, getFirestore } from 'firebase-admin/firestore';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private app!: App;
  private firestore!: Firestore;

  onModuleInit() {
    const serviceAccountPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH!;

    const serviceAccount = JSON.parse(
      readFileSync(serviceAccountPath, 'utf8'),
    );

    this.app = initializeApp({
      credential: cert(serviceAccount),
    });

    this.firestore = getFirestore(this.app);
  }

  get db(): Firestore {
    return this.firestore;
  }
}