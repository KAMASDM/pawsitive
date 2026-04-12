import React, { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  collection,
  addDoc,
  doc,
  updateDoc,
  increment,
  query,
  where,
  getDocs,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import imageCompression from "browser-image-compression";
import { db, auth } from "../../../firebase";
import { useCurrentChallenge } from "../hooks/useCurrentChallenge";
import { FiCamera, FiX, FiCheck, FiArrowLeft, FiUpload } from "react-icons/fi";
import { XP } from "../../../utils/xpSystem";
import { updateDoc as fsUpdate, doc as fsDoc, setDoc } from "firebase/firestore";

const MAX_CAPTION = 150;

export default function ChallengeSubmitScreen() {
  const navigate = useNavigate();
  const { challenge, loading } = useCurrentChallenge();
  const user = auth.currentUser;

  const fileRef = useRef(null);
  const [preview, setPreview] = useState(null);
  const [file, setFile] = useState(null);
  const [caption, setCaption] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(null);
  const [alreadyEntered, setAlreadyEntered] = useState(false);

  // Check existing entry
  React.useEffect(() => {
    if (!challenge?.id || !user) return;
    const q = query(
      collection(db, "challenges", challenge.id, "entries"),
      where("uid", "==", user.uid),
      limit(1)
    );
    getDocs(q).then((s) => { if (!s.empty) setAlreadyEntered(true); });
  }, [challenge?.id, user]);

  const handleFile = async (e) => {
    const raw = e.target.files?.[0];
    if (!raw) return;
    setError(null);
    try {
      const compressed = await imageCompression(raw, {
        maxSizeMB: 0.3,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      });
      setFile(compressed);
      setPreview(URL.createObjectURL(compressed));
    } catch {
      setError("Failed to process image. Please try another.");
    }
  };

  const handleSubmit = async () => {
    if (!file || !challenge || !user) return;
    setUploading(true);
    setError(null);

    try {
      // Convert compressed image to base64 data URL and store in Firestore
      const photoUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });
      setProgress(100);

      // Get user's first pet for petName/petId
      const { getDatabase, ref, get } = await import("firebase/database");
      const rtdb = getDatabase();
      const petSnap = await get(ref(rtdb, `userPets/${user.uid}`));
      let petId = "", petName = "";
      if (petSnap.exists()) {
        const first = Object.entries(petSnap.val())[0];
        petId = first[0];
        petName = first[1].name || "";
      }

      const entryRef = await addDoc(
        collection(db, "challenges", challenge.id, "entries"),
        {
          uid: user.uid,
          petId,
          petName,
          ownerDisplayName: user.displayName || "Pawppy User",
          petPhotoUrl: photoUrl,
          caption: caption.trim(),
          voteCount: 0,
          timestamp: serverTimestamp(),
        }
      );

      // Entry saved — show success immediately
      setDone(true);

      // Best-effort: update challenge entry count
      updateDoc(doc(db, "challenges", challenge.id), {
        entryCount: increment(1),
      }).catch(() => {});

      // Best-effort: award XP to user
      updateDoc(fsDoc(db, "users", user.uid, "quizStats", "stats"), {
        totalXP: increment(XP.CHALLENGE_SUBMITTED),
      }).catch(() => {});

      // Best-effort: write user's challenge history record for ActivityPage
      setDoc(fsDoc(db, "users", user.uid, "challengeHistory", challenge.id), {
        challengeId: challenge.id,
        theme: challenge.theme,
        prompt: challenge.prompt,
        petPhotoUrl: photoUrl,
        petName,
        entryId: entryRef.id,
        joinedAt: new Date().toISOString(),
        voteCount: 0,
      }).catch(() => {});
    } catch (err) {
      console.error(err);
      setError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 rounded-full border-4 border-violet-200 border-t-violet-500 animate-spin" />
      </div>
    );
  }

  if (!challenge) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <span className="text-5xl mb-4">📸</span>
        <h2 className="text-lg font-bold text-slate-800">No active challenge</h2>
        <p className="text-sm text-gray-500 mt-1">Come back on Tuesday when the next challenge goes live!</p>
        <button onClick={() => navigate(-1)} className="mt-6 text-violet-600 font-semibold text-sm">← Go back</button>
      </div>
    );
  }

  if (alreadyEntered) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <span className="text-5xl mb-4">✅</span>
        <h2 className="text-lg font-bold text-slate-800">You're already in!</h2>
        <p className="text-sm text-gray-500 mt-1">You've already submitted an entry for this week's challenge.</p>
        <button
          onClick={() => navigate("/challenge/feed")}
          className="mt-6 bg-violet-600 text-white font-semibold text-sm px-6 py-3 rounded-full"
        >
          View the Feed
        </button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 px-6 text-center">
        <motion.span
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          className="text-6xl mb-4"
        >🎉</motion.span>
        <h2 className="text-xl font-bold text-slate-800">Entry submitted!</h2>
        <p className="text-sm text-gray-500 mt-1">Your pet is now in the running. Share with friends to get more votes!</p>
        <div className="flex gap-3 mt-6">
          <button
            onClick={() => navigate("/challenge/feed")}
            className="bg-violet-600 text-white font-semibold text-sm px-5 py-3 rounded-full"
          >
            View Feed
          </button>
          <button
            onClick={() => navigate(-1)}
            className="border border-violet-200 text-violet-600 font-semibold text-sm px-5 py-3 rounded-full"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-24">
      {/* Top bar */}
      <div className="sticky top-0 z-30 bg-white/90 backdrop-blur-sm border-b border-violet-100 h-14 flex items-center px-4 gap-3">
        <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-violet-600">
          <FiArrowLeft size={20} />
        </button>
        <div className="flex-1">
          <p className="font-bold text-slate-800 text-sm">Join This Week's Challenge</p>
          <p className="text-xs text-violet-500 truncate">{challenge.theme}</p>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 pt-6 space-y-5">
        {/* Prompt card */}
        <div className="bg-gradient-to-r from-violet-600 to-purple-700 rounded-2xl p-4 text-white">
          <p className="text-[10px] font-bold text-violet-200 uppercase tracking-widest mb-1">This Week's Prompt</p>
          <p className="font-bold text-base">"{challenge.prompt}"</p>
        </div>

        {/* Photo picker */}
        <div
          className={`relative rounded-2xl overflow-hidden border-2 border-dashed transition-colors cursor-pointer ${preview ? "border-transparent" : "border-violet-200 hover:border-violet-400 bg-violet-50/50"}`}
          style={{ minHeight: 240 }}
          onClick={() => !preview && fileRef.current?.click()}
        >
          {preview ? (
            <>
              <img src={preview} alt="preview" className="w-full object-cover max-h-72" />
              <button
                onClick={(e) => { e.stopPropagation(); setPreview(null); setFile(null); }}
                className="absolute top-2 right-2 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white"
              >
                <FiX size={14} />
              </button>
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-60 gap-3">
              <div className="w-16 h-16 rounded-2xl bg-violet-100 flex items-center justify-center">
                <FiCamera size={28} className="text-violet-500" />
              </div>
              <p className="text-sm font-semibold text-violet-600">Tap to add photo</p>
              <p className="text-xs text-gray-400">Gallery or Camera</p>
            </div>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFile}
          />
        </div>

        {/* Caption */}
        <div className="bg-white rounded-2xl border border-violet-100 p-4">
          <label className="text-xs font-bold text-violet-500 uppercase tracking-widest block mb-2">Caption</label>
          <textarea
            rows={3}
            maxLength={MAX_CAPTION}
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder={`Tell us about your pet's moment…`}
            className="w-full text-sm text-slate-700 resize-none outline-none placeholder-gray-300"
          />
          <p className={`text-right text-xs mt-1 ${caption.length >= MAX_CAPTION - 10 ? "text-red-400" : "text-gray-300"}`}>
            {caption.length}/{MAX_CAPTION}
          </p>
        </div>

        {error && <p className="text-sm text-red-500 text-center">{error}</p>}

        {/* Upload progress */}
        {uploading && (
          <div className="w-full bg-violet-100 rounded-full h-2">
            <div
              className="bg-violet-500 h-2 rounded-full transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <button
          onClick={handleSubmit}
          disabled={!file || uploading}
          className="w-full bg-gradient-to-r from-violet-500 to-purple-600 text-white font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-40 shadow-lg shadow-violet-200 transition-opacity"
        >
          {uploading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Uploading {progress}%…
            </>
          ) : (
            <><FiUpload size={16} /> Submit Entry</>
          )}
        </button>
      </div>
    </div>
  );
}
