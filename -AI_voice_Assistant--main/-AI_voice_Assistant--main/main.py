import datetime
import os
import speech_recognition as sr
import pyttsx3
import wikipedia
import pyaudio
import webbrowser
import smtplib


engine = pyttsx3.init('sapi5')
voices = engine.getProperty('voices')
engine.setProperty('voice',voices[1].id)#voice change

#how to change the speed of voice



def speak(audio):
    engine.say(audio)
    engine.runAndWait()

def wishMe():
    hour = int (datetime.datetime.now().hour)
    if hour>=0 and hour<12:
        speak("Good Morning ")
    elif hour>=12 and hour<18:
        speak("Good afternoon ! Master")
    else:
        speak("Good Evening TOP  G")

    speak("I am Tracy . how may i assist you")

def takeCommand():

       r =sr.Recognizer()#voice configuration
       with sr.Microphone() as source:
           print("Listening...")
           r.pause_threshold = 1   #delay to acknowlege content
           r.energy_threshold = 700   #audio sensitivity
           audio = r.listen(source)
       try:
           print("Recognising.......")
           query=r.recognize_google(audio,language='en-in')
           print(f"User said: {query}\n")

       except Exception as e:
           print("Sorry didnt get that ....")
           return "None"
       return query
def sendEmail(to,conmtent):
    server= smtplib.SMTP('smntp.gmail.com',587)
    server.ehlo()
    server.starttls()
    server.login('youremail@gmail.com','yourpassword')
    ##
    server.close()


if __name__== "__main__":
    wishMe()
    while True:
     query =  takeCommand().lower()


     #logic based on query
     if 'wikipedia' in query:
         speak('Searching Wikipedia.....')
         query = query.replace("wikipedia", "")
         results = wikipedia.summary(query,sentences=2,redirect=True)
         speak("Acording to wikipedia")
         print(results)
         speak(results)

     elif 'open youtube' in query:
         webbrowser.open("youtube.com")

     elif 'open google' in query:
         webbrowser.open("google.com")

     elif 'open stackoverflow' in query:
         webbrowser.open("stackoverflow.com")

     elif 'play music' in query:
         music_dir = 'C:\\Users\\idris\\Music'
         songs = os.listdir(music_dir)
         print(songs)#displays songs
         os.startfile(os.path.join(music_dir,songs[0]))
     elif 'time' in query:
         strTime = datetime.datetime.now().strftime("%H:%M:%S")
         speak(f"the time is  {strTime}")

     elif 'open code' in query:
         codepath = "D:\\Microsoft VS Code\\Code.exe"
         os.startfile(codepath)

     elif 'email' in query:
         try:
             speak("what shall i send?")
             content = takeCommand()
             to = "shoaibshuja59@gmail.com"
             sendEmail(to,content)
             speak("Email has been sent !")


         except Exception as e :
             print(e)
             speak("im unable to send the email")

         #machine learning algorithm







