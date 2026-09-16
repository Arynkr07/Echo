from faster_whisper import WhisperModel


model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8"
)


def transcribe_audio(audio_path):

    segments, info = model.transcribe(
        audio_path,
        beam_size=5
    )

    print("Detected language:", info.language)
    print("Language probability:", info.language_probability)

    transcript = []

    for segment in segments:

        transcript.append({
            "start": segment.start,
            "end": segment.end,
            "text": segment.text.strip()
        })

    return transcript


if __name__ == "__main__":

    audio_file = "meeting.wav"

    results = transcribe_audio(audio_file)

    for segment in results:

        print(
            f"[{segment['start']:.2f}s → {segment['end']:.2f}s] "
            f"{segment['text']}"
        )