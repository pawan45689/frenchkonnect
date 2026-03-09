// services/transcribeService.js
import fs    from "fs";
import axios from "axios";

const API_KEY  = process.env.ASSEMBLYAI_API_KEY;
const BASE_URL = "https://api.assemblyai.com/v2";
const headers  = { authorization: API_KEY };

const uploadFile = async (filePath) => {
  const stream = fs.createReadStream(filePath);
  const res = await axios.post(`${BASE_URL}/upload`, stream, {
    headers: {
      authorization:      API_KEY,
      "content-type":     "application/octet-stream",
      "transfer-encoding":"chunked",
    },
    maxBodyLength: Infinity,
  });
  return res.data.upload_url;
};

const startTranscription = async (uploadUrl, languageCode) => {
  try {
    const body = {
      audio_url:     uploadUrl,
      punctuate:     true,
      format_text:   true,
      speech_models: ["universal-2"],
    };
    if (languageCode && languageCode !== "en") body.language_code = languageCode;

    const res = await axios.post(`${BASE_URL}/transcript`, body, {
      headers: { ...headers, "content-type": "application/json" },
    });
    return res.data.id;
  } catch (err) {
    console.error("AssemblyAI Error:", err.response?.data);
    throw err;
  }
};

const pollResult = async (id) => {
  while (true) {
    const res  = await axios.get(`${BASE_URL}/transcript/${id}`, { headers });
    const data = res.data;
    if (data.status === "completed") return data;
    if (data.status === "error")     throw new Error(data.error);
    await new Promise(r => setTimeout(r, 2000));
  }
};

const wordsToCues = (words) => {
  if (!words?.length) return [];
  const cues = [];
  let group = [], groupStart = words[0].start;

  const flush = (endMs) => {
    if (!group.length) return;
    cues.push({
      start: parseFloat((groupStart / 1000).toFixed(2)),
      end:   parseFloat((endMs      / 1000).toFixed(2)),
      text:  group.map(w => w.text).join(" "),
    });
    group = [];
  };

  for (const word of words) {
    if (!group.length) groupStart = word.start;
    group.push(word);
    if (/[.!?]$/.test(word.text)) flush(word.end);
  }
  flush(words[words.length - 1].end);
  return cues;
};

export const transcribeAudio = async (filePath, languageCode = "en") => {
  console.log("🎙️  Uploading...");
  const uploadUrl = await uploadFile(filePath);

  console.log("🔄  Transcribing...");
  const id = await startTranscription(uploadUrl, languageCode);

  console.log("⏳  Waiting...");
  const result = await pollResult(id);

  console.log("✅  Done!", result.words?.length, "words");
  return wordsToCues(result.words);
};