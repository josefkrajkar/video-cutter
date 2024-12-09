import { useState, useEffect, useRef } from "react";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile } from "@ffmpeg/util";
import coreURL from "@ffmpeg/core?url";
import wasmURL from "@ffmpeg/core/wasm?url";

export function useFfmpeg() {
    const [isLoading, setIsLoading] = useState(true);
    const ffmpegRef = useRef<FFmpeg | null>(null);

    useEffect(() => {
        ffmpegRef.current = new FFmpeg();
        ffmpegRef.current.load({
            coreURL,
            wasmURL
        }).then(() => {
            setIsLoading(false);
        });
    }, []);

    const handleTrim = async (videoFile: File, startTime: number, endTime: number) => {
        const ffmpeg = ffmpegRef.current;
        if (!ffmpeg) return;


        ffmpeg.writeFile(videoFile.name, await fetchFile(videoFile));
        ffmpeg.on('progress', (progress) => {
            console.log('Processing: ' + Math.round(progress.progress * 100) + '% done');
        });
        await ffmpeg.exec(['-ss', startTime.toString(), '-i', videoFile.name, '-to', endTime.toString(), '-c:v', 'copy', '-c:a', 'copy', 'output.mp4']);
        const data = await ffmpeg.readFile('output.mp4') as Uint8Array;
        const videoBlob = new Blob([data.buffer], { type: "video/mp4" });
        const url = URL.createObjectURL(videoBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'trimmed-video.mp4';
        a.click();
        URL.revokeObjectURL(url);
    };

    return { ffmpeg: ffmpegRef.current, isLoading, handleTrim };
}
