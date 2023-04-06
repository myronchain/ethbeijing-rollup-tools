import { initializeApp } from "firebase/app";
import {
  addDoc,
  collection,
  doc,
  Firestore,
  getDocs,
  getFirestore,
  limit,
  orderBy,
  query,
  setDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import {
  DB,
  FirebaseConfig,
  L1Logic,
  L1VersionedLogics,
  L2Genesis,
  L2Logic,
  L2VersionedLogics,
  RollupContracts,
} from "./deploy_types";
import { CollectionReference } from "@firebase/firestore";
import { ContractNames } from "../src/constants";
import { isEqual } from "lodash";

export default class FirestoreDB implements DB {
  private readonly db: Firestore;
  private readonly l1LogicsRef: CollectionReference;
  private readonly l1VersionedLogicsRef: CollectionReference;
  private readonly l2LogicsRef: CollectionReference;
  private readonly l2VersionedLogicsRef: CollectionReference;
  private readonly rollupContractsRef: CollectionReference;
  private readonly l2GenesisRef: CollectionReference;

  constructor(firebaseConfig: FirebaseConfig) {
    const app = initializeApp(firebaseConfig);
    this.db = getFirestore(app);
    this.l1LogicsRef = collection(this.db, "l1_logics");
    this.l1VersionedLogicsRef = collection(this.db, "l1_versioned_logics");
    this.l2LogicsRef = collection(this.db, "l2_logics");
    this.l2VersionedLogicsRef = collection(this.db, "l2_versioned_logics");
    this.rollupContractsRef = collection(this.db, "rollup_contracts");
    this.l2GenesisRef = collection(this.db, "l2_genesis");
  }

  async saveL1Logic(data: L1Logic): Promise<void> {
    await addDoc(this.l1LogicsRef, data);
  }

  async saveL1Logics(data: L1Logic[]): Promise<void> {
    const batch = writeBatch(this.db);
    data.forEach(item => batch.set(doc(this.l1LogicsRef), item));
    await batch.commit();
  }

  async getL1Logic(l1ChainId: number, codeHash: string): Promise<L1Logic | null> {
    const q = query(
      this.l1LogicsRef,
      where("L1ChainId", "==", l1ChainId),
      where("CodeHash", "==", codeHash)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs?.[0]?.data() as L1Logic | null
  }

  async getL1Logics(l1ChainId: number, codeHashes: string[]): Promise<L1Logic[]> {
    const q = query(
      this.l1LogicsRef,
      where("L1ChainId", "==", l1ChainId),
      where("CodeHash", "in", codeHashes),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(it => it.data() as L1Logic)
  }

  async saveL1VersionedLogics(data: L1VersionedLogics): Promise<void> {
    const doc = await this.getL1VersionedLogics(data.L1ChainId, data.Version);
    if (!doc) {
      await addDoc(this.l1VersionedLogicsRef, data);
    } else {
      console.log(`l1 logics of version:${data.Version} already exist`);
      if (!isEqual(doc, data)) {
        throw new Error(`saveL1VersionedLogics: invalid data: ${JSON.stringify(data)}`)
      }
    }
  }

  async getL1VersionedLogics(l1ChainId: number, version: number): Promise<L1VersionedLogics | null> {
    const q = query(
      this.l1VersionedLogicsRef,
      where("L1ChainId", "==", l1ChainId),
      where("Version", "==", version)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs?.[0]?.data() as L1VersionedLogics | null;
  }

  async getL1ProxyAdminAddress(l1ChainId: number): Promise<string | null> {
    const q = query(
      this.l1LogicsRef,
      where('L1ChainId', "==", l1ChainId),
      where("ContractName", "==", ContractNames.G1G2ProxyAdmin),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs?.[0]?.data()?.['Address']
  }

  async getL2Logics(l1ChainId: number, l2ChainId: number, codeHashes: string[]): Promise<L2Logic[]> {
    const q = query(
      this.l2LogicsRef,
      where("L1ChainId", "==", l1ChainId),
      where("L2ChainId", "==", l2ChainId),
      where("CodeHash", "in", codeHashes),
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(it => it.data() as L2Logic);
  }

  async saveL2Logics(data: L2Logic[]): Promise<void> {
    const batch = writeBatch(this.db);
    data.forEach(item => batch.set(doc(this.l2LogicsRef), item));
    await batch.commit();
  }

  async saveL2Logic(data: L2Logic): Promise<void> {
    await this.saveL2Logics([data]);
  }

  async getL2VersionedLogics(l1ChainId: number, l2ChainId: number, version: number): Promise<L2VersionedLogics | null> {
    const q = query(
      this.l2VersionedLogicsRef,
      where("L1ChainId", "==", l1ChainId),
      where("L2ChainId", "==", l2ChainId),
      where("Version", "==", version),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs?.[0]?.data() as L2VersionedLogics | null;
  }

  async saveL2VersionedLogics(data: L2VersionedLogics, overwrite: boolean): Promise<void> {
    const q = query(
      this.l2VersionedLogicsRef,
      where("L1ChainId", "==", data.L1ChainId),
      where("L2ChainId", "==", data.L2ChainId),
      where("Version", "==", data.Version),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    const doc = querySnapshot.docs?.[0];
    if (!doc) {
      await addDoc(this.l2VersionedLogicsRef, data);
    } else {
      console.log(`l2 logics of version:${data.Version} already exist`);
      if (overwrite) {
        console.log("overwrite l2 versioned logics!");
        await setDoc(doc.ref, data, { merge: true });
      } else if (!isEqual(doc, data)) {
        throw new Error(`saveL2VersionedLogics: invalid data: ${JSON.stringify(data)}`)
      }
    }
  }

  async getRollupContracts(l1ChainId: number, l2ChainId: number): Promise<RollupContracts | null> {
    const q = query(
      this.rollupContractsRef,
      where("L1ChainId", "==", l1ChainId),
      where("L2ChainId", "==", l2ChainId),
      orderBy("Version", "desc"),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs?.[0]?.data() as RollupContracts | null;
  }

  async saveRollupContracts(data: RollupContracts): Promise<void> {
    await addDoc(this.rollupContractsRef, data);
  }

  async updateRollupVersion(l1ChainId: number, l2ChainId: number, version: number): Promise<void> {
    console.log(`updateRollupVersion, l1ChainId:${l1ChainId}, l2ChainId:${l2ChainId}, version:${version}`);
    const q = query(
      this.rollupContractsRef,
      where("L1ChainId", "==", l1ChainId),
      where("L2ChainId", "==", l2ChainId),
      limit(1)
    );
    const querySnapshot = await getDocs(q);
    const ref = querySnapshot.docs?.[0]?.ref;
    if (ref) {
      await setDoc(ref, { Version: version }, { merge: true });
      console.log("updateRollupVersion success!");
    } else {
      throw new Error(`rollup contracts of l1ChainId:${l1ChainId} l2ChainId:${l2ChainId} not exist!`)
    }
  }

  async saveL2Genesis(data: L2Genesis): Promise<void> {
    await addDoc(this.l2GenesisRef, data);
  }

  async deleteAll(): Promise<void> {
    await Promise.all([
      this.__deleteCollection(this.l1LogicsRef),
      this.__deleteCollection(this.l1VersionedLogicsRef),
      this.__deleteCollection(this.l2LogicsRef),
      this.__deleteCollection(this.l2VersionedLogicsRef),
      this.__deleteCollection(this.rollupContractsRef),
      this.__deleteCollection(this.l2GenesisRef),
    ])
  }

  async deleteL1(l1ChainId: number): Promise<void> {
    await Promise.all([
      this.__deleteL1(this.l1LogicsRef, l1ChainId),
      this.__deleteL1(this.l1VersionedLogicsRef, l1ChainId),
      this.__deleteL1(this.l2LogicsRef, l1ChainId),
      this.__deleteL1(this.l2VersionedLogicsRef, l1ChainId),
      this.__deleteL1(this.rollupContractsRef, l1ChainId),
      this.__deleteL1(this.l2GenesisRef, l1ChainId),
    ]);
  }

  async deleteL2(l1ChainId: number, l2ChainId: number): Promise<void> {
    await Promise.all([
      this.__deleteL2(this.l2LogicsRef, l1ChainId, l2ChainId),
      this.__deleteL2(this.l2VersionedLogicsRef, l1ChainId, l2ChainId),
      this.__deleteL2(this.rollupContractsRef, l1ChainId, l2ChainId),
      this.__deleteL2(this.l2GenesisRef, l1ChainId, l2ChainId),
    ]);
  }

  private async __deleteCollection(collectionRef: CollectionReference): Promise<void> {
    const batch = writeBatch(this.db);
    const q = query(collectionRef);
    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach(item => batch.delete(item.ref))
    await batch.commit();
  }

  private async __deleteL1(collectionRef: CollectionReference, l1ChainId: number): Promise<void> {
    const batch = writeBatch(this.db);
    const q = query(collectionRef, where("L1ChainId", "==", l1ChainId));
    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach(item => batch.delete(item.ref));
    await batch.commit();
  }

  private async __deleteL2(collectionRef: CollectionReference, l1ChainId: number, l2ChainId: number): Promise<void> {
    const batch = writeBatch(this.db);
    const q = query(
      collectionRef,
      where("L1ChainId", "==", l1ChainId),
      where("L2ChainId", "==", l2ChainId)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.docs.forEach(item => batch.delete(item.ref));
    await batch.commit();
  }
}