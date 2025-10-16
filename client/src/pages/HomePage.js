import { useEffect, useMemo, useState } from "react";
import "../styling/home.css";

const BACKGROUND_TEXT = `the team was amazing and helped me find a job faster than I expected.
They listened to what I wanted and actually cared about matching me with the right company.
The process was smooth and easy from start to finish.
Communication was quick and I always knew what was happening.
They checked in often and made sure I felt confident before interviews.
I felt supported the whole way through.
They were professional but also friendly and approachable.
I appreciated how honest they were about each opportunity.
It never felt like they were just trying to fill a role.
They gave me great advice and feedback that helped me improve my interviews.
The staff were patient and understanding when I had questions.
They worked hard to find positions that matched my skills perfectly.
I was impressed with how quickly they responded to emails.
Every interaction felt positive and genuine.
I could tell they cared about people not just placements.
They helped me polish my CV and made me feel prepared.
The experience gave me a lot more confidence in my job search.
I appreciated their honesty about what employers were looking for.
They treated me with respect and kindness the entire time.
I was never left waiting or wondering what was next.
The attention to detail was incredible.
They made sure I understood every step of the process.
The agency felt reliable and trustworthy.
I could feel their dedication from the very first call.
They celebrated my success like it was their own.
It felt good to know someone was in my corner.
The whole process was fast but never rushed.
They made me feel like a priority.
I am so grateful for the effort they put into finding the right fit.
They were always positive and encouraging even when I doubted myself.
It felt like working with friends who wanted me to win.
I would recommend them to anyone looking for a real career move.
They made a stressful process feel simple and rewarding.
I ended up with a role I love and I owe that to their hard work.
he team was amazing and helped me find a job faster than I expected.
They listened to what I wanted and actually cared about matching me with the right company.
The process was smooth and easy from start to finish.
Communication was quick and I always knew what was happening.
They checked in often and made sure I felt confident before interviews.
I felt supported the whole way through.
They were professional but also friendly and approachable.
I appreciated how honest they were about each opportunity.
It never felt like they were just trying to fill a role.
They gave me great advice and feedback that helped me improve my interviews.
The staff were patient and understanding when I had questions.
They worked hard to find positions that matched my skills perfectly.
I was impressed with how quickly they responded to emails.
Every interaction felt positive and genuine.
I could tell they cared about people not just placements.
They helped me polish my CV and made me feel prepared.
The experience gave me a lot more confidence in my job search.
I appreciated their honesty about what employers were looking for.
They treated me with respect and kindness the entire time.
I was never left waiting or wondering what was next.
The attention to detail was incredible.
They made sure I understood every step of the process.
The agency felt reliable and trustworthy.
I could feel their dedication from the very first call.
They celebrated my success like it was their own.
It felt good to know someone was in my corner.
The whole process was fast but never rushed.
They made me feel like a priority.
I am so grateful for the effort they put into finding the right fit.
They were always positive and encouraging even when I doubted myself.
It felt like working with friends who wanted me to win.
I would recommend them to anyone looking for a real career move.
They made a stressful process feel simple and rewarding.
I ended up with a role I love and I owe that to their hard work.
he team was amazing and helped me find a job faster than I expected.
They listened to what I wanted and actually cared about matching me with the right company.
The process was smooth and easy from start to finish.
Communication was quick and I always knew what was happening.
They checked in often and made sure I felt confident before interviews.
I felt supported the whole way through.
They were professional but also friendly and approachable.
I appreciated how honest they were about each opportunity.
It never felt like they were just trying to fill a role.
They gave me great advice and feedback that helped me improve my interviews.
The staff were patient and understanding when I had questions.
They worked hard to find positions that matched my skills perfectly.
I was impressed with how quickly they responded to emails.
Every interaction felt positive and genuine.
I could tell they cared about people not just placements.
They helped me polish my CV and made me feel prepared.
The experience gave me a lot more confidence in my job search.
I appreciated their honesty about what employers were looking for.
They treated me with respect and kindness the entire time.
I was never left waiting or wondering what was next.
The attention to detail was incredible.
They made sure I understood every step of the process.
The agency felt reliable and trustworthy.
I could feel their dedication from the very first call.
They celebrated my success like it was their own.
It felt good to know someone was in my corner.
The whole process was fast but never rushed.
They made me feel like a priority.
I am so grateful for the effort they put into finding the right fit.
They were always positive and encouraging even when I doubted myself.
It felt like working with friends who wanted me to win.
I would recommend them to anyone looking for a real career move.
They made a stressful process feel simple and rewarding.
I ended up with a role I love and I owe that to their hard work.
The team was amazing and helped me find a job faster than I expected.
They listened to what I wanted and actually cared about matching me with the right company.
The process was smooth and easy from start to finish.
Communication was quick and I always knew what was happening.
They checked in often and made sure I felt confident before interviews.
I felt supported the whole way through.
They were professional but also friendly and approachable.
I appreciated how honest they were about each opportunity.
It never felt like they were just trying to fill a role.
They gave me great advice and feedback that helped me improve my interviews.
The staff were patient and understanding when I had questions.
They worked hard to find positions that matched my skills perfectly.
I was impressed with how quickly they responded to emails.
Every interaction felt positive and genuine.
I could tell they cared about people not just placements.
They helped me polish my CV and made me feel prepared.
The experience gave me a lot more confidence in my job search.
I appreciated their honesty about what employers were looking for.
They treated me with respect and kindness the entire time.
I was never left waiting or wondering what was next.
The attention to detail was incredible.
They made sure I understood every step of the process.
The agency felt reliable and trustworthy.
I could feel their dedication from the very first call.
They celebrated my success like it was their own.
It felt good to know someone was in my corner.
The whole process was fast but never rushed.
They made me feel like a priority.
I am so grateful for the effort they put into finding the right fit.
They were always positive and encouraging even when I doubted myself.
It felt like working with friends who wanted me to win.
I would recommend them to anyone looking for a real career move.
They made a stressful process feel simple and rewarding.
I ended up with a role I love and I owe that to their hard work.`;

const SENTENCES = BACKGROUND_TEXT.split(/(?<=\.)\s+/);

export default function HomePage() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const intervalMs = 30;
    const durationMs = 10000;
    const totalSteps = Math.ceil(durationMs / intervalMs);
    let currentStep = 0;

    const intervalId = setInterval(() => {
      currentStep += 1;
      setProgress((prev) => {
        const next = Math.min(1, currentStep / totalSteps);
        if (next >= 1) {
          clearInterval(intervalId);
        }
        return next;
      });
    }, intervalMs);

    return () => clearInterval(intervalId);
  }, []);

  const typedSentences = useMemo(
    () =>
      SENTENCES.map((sentence) => {
        if (progress >= 1) {
          return sentence;
        }

        const visibleCharacters = Math.floor(sentence.length * progress);
        return sentence.slice(0, visibleCharacters);
      }),
    [progress]
  );

  return (
    <section className="hero-section">
      <div className="hero-background-text" aria-hidden="true">
        {typedSentences.map((sentence, index) => (
          <span key={index}>
            {sentence}
            {progress < 1 && index === typedSentences.length - 1 ? "\u2588" : ""}
            {index !== typedSentences.length - 1 ? " " : ""}
          </span>
        ))}
      </div>

      <div className="hero-content">
        <h1 className="hero-title">
          <span>We Break Barriers</span>
          <span className="accent">for your success.</span>
        </h1>

        <p className="hero-subtext">
          Submit your resume today and connect with top companies in search of the best talent.
        </p>

        <button type="button" className="hero-cta">
          Connect with us!
        </button>
      </div>
    </section>
  );
}
