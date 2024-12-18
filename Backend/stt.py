import speech_recognition as sr
import playsound

class OnlineSST:
    def __init__(self):
        self.recognizer = sr.Recognizer()

    def speak(self, text):
        # tts = gTTS(text=text, lang='ta')
        # filename = 'voice.mp3'
        # tts.save(filename)
        # playsound.playsound(filename)
        print(text)

#     def get_audio(self):
#         with sr.Microphone() as source:
#             self.recognizer.adjust_for_ambient_noise(source)
#             audio = self.recognizer.listen(source)
#             said = ""

#             try:
#                 said = self.recognizer.recognize_google(audio,language='en-US')
#                 print(said)
#             except sr.UnknownValueError:
#                 print("Could not understand audio")
#             except sr.RequestError as e:
#                 print("Could not request results; {0}".format(e))

#         return said.lower()

# if __name__ == "__main__":
#     voice_assistant = OnlineSST()
#     voice_assistant.get_audio()
    def get_audio_from_file(self, file_path):
        with sr.AudioFile(file_path) as source:
            self.recognizer.adjust_for_ambient_noise(source)
            audio = self.recognizer.record(source)
            said = ""

            try:
                said = self.recognizer.recognize_google(audio, language='en-US')
                print(said)
            except sr.UnknownValueError:
                print("Could not understand audio")
            except sr.RequestError as e:
                print(f"Could not request results; {e}")

        return said.lower()

if __name__ == "__main__":
    voice_assistant = OnlineSST()
    # Replace 'your_audio_file.wav' with the path to your audio file
    audio_file_path = '/Users/danieldas/Desktop/1st Cross Street 19.wav'
    voice_assistant.get_audio_from_file(audio_file_path)