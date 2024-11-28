export const processVideo = async (file: File, trimStart: number, trimEnd: number) => {
  const videoReader = file.stream().getReader();
  const videoChunks: VideoFrame[] = [];

  const videoDecoder = new VideoDecoder({
    output: (frame) => {
      const timestamp = frame.timestamp / 1_000_000; // Převod na sekundy
      if (timestamp >= trimStart && timestamp <= trimEnd) {
        videoChunks.push(frame);
      } else {
        frame.close(); // Uvolnění paměti
      }
    },
    error: (e) => console.error('Decoder error:', e),
  });

  let reading = true;
  while (reading) {
    const { value, done } = await videoReader.read();
    if (done) {
      reading = false;
      break;
    }

    videoDecoder.decode(new EncodedVideoChunk({
      type: 'key',
      timestamp: 0, // Pokud znáš čas chunku, uprav
      data: value!,
    }));
  }

  await videoDecoder.flush();
  return videoChunks;
};

export const encodeVideo = async (frames: VideoFrame[], outputCallback: (data: Blob) => void) => {
  if (frames.length === 0) {
    throw new Error('No frames to encode');
  }

  const chunks: Uint8Array[] = [];
  let frameCounter = 0;

  const videoEncoder = new VideoEncoder({
    output: (chunk) => {
      const chunkData = new Uint8Array(chunk.byteLength);
      chunk.copyTo(chunkData);
      chunks.push(chunkData);
    },
    error: (e) => console.error('Encoder error:', e),
  });

  try {
    await videoEncoder.configure({
      codec: 'vp8',
      width: frames[0].codedWidth,
      height: frames[0].codedHeight,
      bitrate: 2_000_000, // Increased bitrate for better quality
      framerate: 30,
      latencyMode: 'realtime',
    });

    for (const frame of frames) {
      await videoEncoder.encode(frame, { keyFrame: frameCounter % 30 === 0 }); // Force keyframe every 30 frames
      frame.close();
      frameCounter++;
    }

    await videoEncoder.flush();
    const blob = new Blob(chunks, { type: 'video/webm; codecs=vp8' });
    outputCallback(blob);
  } catch (error) {
    console.error('Error during video encoding:', error);
    throw error;
  } finally {
    videoEncoder.close();
  }
};

export const trimVideo = async (file: File, trimStart: number, trimEnd: number) => {
  const frames = await processVideo(file, trimStart, trimEnd);

  await encodeVideo(frames, (output) => {
    const url = URL.createObjectURL(output);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'trimmed-video.webm';
    a.click();
    URL.revokeObjectURL(url);
  });
};
