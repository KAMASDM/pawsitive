import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { get, ref, remove, set, update } from "firebase/database";
import { doc, setDoc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref as storageRef, uploadString } from "firebase/storage";

const projectId = "pawppy-rules-test";
let testEnv;

beforeAll(async () => {
  testEnv = await initializeTestEnvironment({
    projectId,
    database: { rules: readFileSync("database.rules.json", "utf8") },
    firestore: { rules: readFileSync("firestore.rules", "utf8") },
    storage: { rules: readFileSync("storage.rules", "utf8") },
  });
});

afterEach(async () => {
  if (!testEnv) return;
  await testEnv.clearDatabase();
  await testEnv.clearFirestore();
  await testEnv.clearStorage();
});

afterAll(async () => {
  await testEnv?.cleanup();
});

const auth = (uid, claims = {}) => testEnv.authenticatedContext(uid, claims);

describe("Realtime Database ownership", () => {
  it("allows owners to edit lost reports and rejects other users", async () => {
    const ownerDb = auth("owner", { email: "owner@example.com" }).database();
    const strangerDb = auth("stranger", { email: "stranger@example.com" }).database();
    const report = {
      petType: "dog",
      petName: "Milo",
      lastSeenDate: "2026-07-20",
      lastSeenLocation: "Pune",
      userId: "owner",
      status: "lost",
      createdAt: Date.now(),
    };
    await assertSucceeds(set(ref(ownerDb, "lostPets/report-1"), report));
    await assertSucceeds(update(ref(ownerDb, "lostPets/report-1"), { status: "found" }));
    await assertFails(update(ref(strangerDb, "lostPets/report-1"), { status: "closed" }));
    await assertFails(remove(ref(strangerDb, "lostPets/report-1")));
  });

  it("limits new conversations to participants", async () => {
    const aliceDb = auth("alice").database();
    const eveDb = auth("eve").database();
    await assertSucceeds(set(ref(aliceDb, "conversations/chat-1"), {
      participants: { alice: true, bob: true },
      createdAt: Date.now(),
    }));
    await assertSucceeds(get(ref(aliceDb, "conversations/chat-1")));
    await assertFails(get(ref(eveDb, "conversations/chat-1")));
    await assertFails(update(ref(eveDb, "conversations/chat-1"), { lastMessageText: "intercepted" }));
  });

  it("allows notification creation but only the recipient can alter it", async () => {
    const senderDb = auth("sender").database();
    const recipientDb = auth("recipient").database();
    await assertSucceeds(set(ref(senderDb, "notifications/recipient/n1"), {
      type: "message",
      title: "New message",
      read: false,
      timestamp: Date.now(),
    }));
    await assertFails(update(ref(senderDb, "notifications/recipient/n1"), { read: true }));
    await assertSucceeds(update(ref(recipientDb, "notifications/recipient/n1"), { read: true }));
  });
});

describe("Firestore authoritative writes", () => {
  it("rejects direct quiz score and leaderboard writes", async () => {
    const userDb = auth("user-1").firestore();
    await assertFails(setDoc(doc(userDb, "users/user-1/quizHistory/2026-W30"), { score: 5 }));
    await assertFails(setDoc(doc(userDb, "weeklyQuiz/quiz-1/leaderboard/user-1"), { score: 5 }));
  });

  it("rejects direct challenge entries and activity history", async () => {
    const userDb = auth("user-1").firestore();
    await assertFails(setDoc(doc(userDb, "challenges/c1/entries/e1"), { uid: "user-1", voteCount: 0 }));
    await assertFails(setDoc(doc(userDb, "users/user-1/challengeHistory/c1"), { challengeId: "c1" }));
  });

  it("accepts one vote document for another user and rejects counter manipulation", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await setDoc(doc(context.firestore(), "challenges/c1/entries/e1"), {
        uid: "owner",
        voteCount: 0,
      });
    });
    const voterDb = auth("voter").firestore();
    const ownerDb = auth("owner").firestore();
    await assertSucceeds(setDoc(doc(voterDb, "challenges/c1/votes/voter"), {
      entryId: "e1",
      votedAt: new Date(),
      counterManagedBy: "server",
    }));
    await assertFails(setDoc(doc(ownerDb, "challenges/c1/votes/owner"), {
      entryId: "e1",
      votedAt: new Date(),
      counterManagedBy: "server",
    }));
    await assertFails(updateDoc(doc(voterDb, "challenges/c1/entries/e1"), { voteCount: 1000 }));
  });
});

describe("Storage path isolation", () => {
  it("allows an owner avatar upload and rejects writing another user's avatar", async () => {
    const aliceStorage = auth("alice").storage();
    await assertSucceeds(uploadString(storageRef(aliceStorage, "avatars/alice/avatar.png"), "image", "raw", { contentType: "image/png" }));
    await assertFails(uploadString(storageRef(aliceStorage, "avatars/bob/avatar.png"), "image", "raw", { contentType: "image/png" }));
  });

  it("does not expose vendor documents through the fallback wildcard", async () => {
    await testEnv.withSecurityRulesDisabled(async (context) => {
      await uploadString(storageRef(context.storage(), "vendor-documents/alice/pan/document.png"), "private", "raw", { contentType: "image/png" });
    });
    const strangerStorage = auth("stranger").storage();
    await expect(getDownloadURL(storageRef(strangerStorage, "vendor-documents/alice/pan/document.png"))).rejects.toBeTruthy();
  });
});
