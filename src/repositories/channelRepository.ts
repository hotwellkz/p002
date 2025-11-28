import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  orderBy,
  query,
  serverTimestamp,
  updateDoc
} from "firebase/firestore";
import { db } from "../services/firebase";
import type { Channel, ChannelCreatePayload } from "../domain/channel";
import { channelConverter } from "../domain/channel";

const channelCollection = (uid: string) =>
  collection(db, "users", uid, "channels").withConverter(channelConverter);

export interface ChannelRepository {
  getChannels: (uid: string) => Promise<Channel[]>;
  createChannel: (uid: string, data: ChannelCreatePayload) => Promise<Channel>;
  updateChannel: (uid: string, channel: Channel) => Promise<void>;
  deleteChannel: (uid: string, channelId: string) => Promise<void>;
}

export const channelRepository: ChannelRepository = {
  async getChannels(uid) {
    const q = query(channelCollection(uid), orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);
    return snapshot.docs.map((docSnap) => docSnap.data());
  },

  async createChannel(uid, data) {
    const col = channelCollection(uid);
    const docRef = await addDoc(col, {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    const createdSnap = await getDoc(docRef.withConverter(channelConverter));
    if (!createdSnap.exists()) {
      throw new Error("Не удалось создать канал");
    }
    return createdSnap.data();
  },

  async updateChannel(uid, channel) {
    const docRef = doc(db, "users", uid, "channels", channel.id);
    const { id, ...rest } = channel;
    await updateDoc(docRef, {
      ...rest,
      updatedAt: serverTimestamp()
    });
  },

  async deleteChannel(uid, channelId) {
    const docRef = doc(db, "users", uid, "channels", channelId);
    await deleteDoc(docRef);
  }
};

