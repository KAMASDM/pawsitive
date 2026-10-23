import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowDown, ArrowUpRight, Bell, Check, ChevronDown,
  Circle, Heart, PawPrint, Plus, ShieldCheck, Sparkles, Users,
} from 'lucide-react';
import { auth } from '../../firebase';
import heroImage from '../../assets/landing/pawppy-companions-v2.webp';
import './Landing.css';

const SAMPLE = [
  { id: 'breakfast', title: 'Breakfast', petName: 'Milo', time: '08:00', completed: true },
  { id: 'water', title: 'Fresh water', petName: 'Luna', time: '08:30', completed: false },
  { id: 'play', title: 'Play time', petName: 'Milo', time: '18:00', completed: false },
];
const QUESTIONS = [
  ['Do I need to download an app?', 'Start in your browser. When you’re ready, add Pawppy to your home screen. On a supported Android browser, choose Install app. On iPhone, open Pawppy in Safari, tap Share, then Add to Home Screen.'],
  ['Can I use Pawppy with more than one pet?', 'Yes. Bring your pets’ routines together in Today, or filter by pet to focus on one. Each pet has its own care records.'],
  ['Can my family or pet sitter help?', 'Yes. Invite a caregiver to view and record daily care, a viewer to follow along, or a temporary sitter. You can revoke access. Shared daily care includes basic pet profiles and routines, while medical records and expenses stay with the owner.'],
  ['How do reminders work?', 'Opt in to one daily briefing when routines remain open, at a time you choose. Saved health-date reminders and weekly digests have separate settings. Individual activity times organise your Today list; they do not trigger individual alerts.'],
  ['What does it cost?', 'There is no subscription checkout for the care features in this version. Shop purchases are separate, with prices shown before checkout.'],
  ['Can I make a safety tag for my pet?', 'Yes. Create a printable QR safety card and choose the contact details a finder can see. A finder can call or email you without an account. Turn off the link whenever you like. The card is not a location tracker.'],
  ['Can I share my pet’s memories?', 'Create a weekly card with a favourite photo, a caption and selected milestones. Download the image or share a link friends can open without an account. Private health records are excluded.'],
  ['Does Pawppy have an AI assistant?', 'Pawppy Copilot is an optional beta powered by Google Gemini. Ask general care questions or approve a preview of your own pet’s records for a draft summary. It cannot diagnose, prescribe, or change records. Pawppy does not have a proprietary neural network; veterinary decisions belong with your veterinarian.'],
];

function Brand({ inverse = false }) {
  return (
    <Link to="/" className={`lp-brand${inverse ? ' lp-brand-inverse' : ''}`} aria-label="Pawppy home">
      <span className="lp-brand-mark"><PawPrint size={23} strokeWidth={1.8} /></span>
      pawppy<span className="lp-brand-period">.</span>
    </Link>
  );
}

function StartLink({ children = 'Make room for more love', className = '' }) {
  return <Link to="/login?signup=1" className={`lp-button ${className}`}>{children}<ArrowUpRight size={19} /></Link>;
}

function SampleDay() {
  const [tasks, setTasks] = useState(SAMPLE);
  const [pet, setPet] = useState('All pets');
  const visible = tasks.filter(task => pet === 'All pets' || task.petName === pet);
  const done = visible.filter(task => task.completed).length;
  const complete = done === visible.length;

  return (
    <div className="lp-demo" aria-label="Interactive sample care plan">
      <div className="lp-demo-topline">
        <span className="lp-eyebrow"><span className="lp-dot" />Interactive sample</span>
        <button className="lp-reset" onClick={() => { setTasks(SAMPLE); setPet('All pets'); }}>Reset demo</button>
      </div>
      <div className="lp-demo-heading">
        <div><p className="lp-demo-date">A GOOD DAY STARTS HERE</p><h3>Their day. Sorted.</h3><p>A little care for Milo & Luna.</p></div>
        <div className="lp-progress" style={{ '--progress': `${done / visible.length * 100}%` }} aria-hidden="true"><span>{complete ? <Check size={25} /> : <Heart size={24} />}</span></div>
      </div>
      <div className="lp-demo-filters" role="group" aria-label="Sample pet filter">
        {['All pets', 'Milo', 'Luna'].map(name => (
          <button key={name} aria-pressed={pet === name} onClick={() => setPet(name)}>{name === 'All pets' && <PawPrint size={14} />}{name}</button>
        ))}
      </div>
      <div className="lp-demo-tasks">
        {visible.map(task => (
          <button
            key={task.id}
            className={`lp-demo-task${task.completed ? ' is-complete' : ''}`}
            onClick={() => setTasks(previous => previous.map(item => item.id === task.id ? { ...item, completed: !item.completed } : item))}
            aria-label={`${task.completed ? 'Undo' : 'Complete'} ${task.title} for ${task.petName}`}
            aria-pressed={task.completed}
          >
            <span className="lp-task-check">{task.completed ? <Check size={19} /> : <Circle size={23} strokeWidth={1.3} />}</span>
            <span className="lp-task-info"><strong>{task.title}</strong><span><i className={`lp-pet-dot ${task.petName === 'Luna' ? 'lp-pet-dot-cat' : ''}`} />{task.petName} · Daily care</span></span>
            <span className="lp-task-time">{task.completed ? 'Done' : task.time}</span>
          </button>
        ))}
      </div>
      <div className={`lp-demo-result${complete ? ' is-complete' : ''}`}>
        <Sparkles size={18} aria-hidden="true" />
        <p role="status" aria-live="polite">{done} of {visible.length} sample routines done<span>{complete ? 'A little more peace of mind.' : 'Tap a circle. Feel a little lighter.'}</span></p>
      </div>
      <p className="lp-demo-disclaimer">Fictional pets. Your demo changes reset when you leave.</p>
    </div>
  );
}

export default function Landing() {
  const navigate = useNavigate();
  useEffect(() => auth.onAuthStateChanged(user => {
    if (user && (user.emailVerified || !user.providerData.some(provider => provider.providerId === 'password'))) navigate('/today', { replace: true });
  }), [navigate]);

  return (
    <div className="pawppy-landing">
      <a className="lp-skip" href="#landing-content">Skip to content</a>
      <div className="lp-shell">
        <nav aria-label="Main" className="lp-nav">
          <Brand />
          <div className="lp-nav-links"><a href="#how-it-works">The everyday, easier</a><a href="#try-today">Try Pawppy</a><a href="#questions">Good questions</a></div>
          <div className="lp-nav-actions"><Link to="/login" className="lp-sign-in">Sign in</Link><StartLink className="lp-button-small">Get started</StartLink></div>
        </nav>

        <section className="lp-hero" id="landing-content">
          <div className="lp-hero-copy">
            <p className="lp-eyebrow lp-hero-eyebrow"><span className="lp-dot" /><span>Pet Parent Operating System</span></p>
            <h1>Less to{' '}<br />remember.<br /><span>More to <em>love.</em></span></h1>
            <p className="lp-hero-description">Their routines. Their records. Their favourite humans.<br className="lp-desktop-break" /> One thoughtful home for a life together.</p>
            <div className="lp-hero-actions"><StartLink>Build my pet’s care plan</StartLink><a href="#try-today" className="lp-text-link"><span className="lp-play-icon"><ArrowDown size={15} /></span>Take a little look</a></div>
            <p className="lp-hero-note"><ShieldCheck size={15} />Start in your browser. Make it yours.</p>
          </div>

          <div className="lp-hero-art">
            <div className="lp-art-orbit" aria-hidden="true" />
            <div className="lp-pet-portrait"><img src={heroImage} width="1254" height="1254" fetchPriority="high" alt="A golden retriever and a ginger cat sitting side by side" /></div>
            <span className="lp-art-spark" aria-hidden="true">✳</span>
            <div className="lp-love-note"><Heart size={17} /><span>A whole lot<br /><em>of love.</em></span></div>
            <div className="lp-floating-care">
              <span className="lp-floating-icon"><Check size={18} /></span>
              <div><span className="lp-mini-label">A SAMPLE MOMENT</span><strong>Morning care? All sorted.</strong><p>More time for the good stuff.</p></div>
            </div>
            <div className="lp-floating-family"><span className="lp-family-symbol"><Users size={20} /></span><span>One little team.<strong>One very loved pet.</strong></span></div>
            <span className="lp-art-caption">LIFE TOGETHER, A LITTLE LIGHTER.</span>
          </div>
        </section>

        <div className="lp-belief-strip">
          <p>Big love.<br /><em>Little everyday things.</em></p>
          <span><PawPrint />Every pet, in one place</span><span><Users />A care team that’s connected</span><span><Heart />More moments that matter</span>
        </div>
      </div>

      <section className="lp-everyday lp-shell lp-section" id="how-it-works">
        <div className="lp-section-heading"><div><p className="lp-eyebrow">THE EVERYDAY, BEAUTIFULLY CONNECTED</p><h2>Because loving them<br />comes with <em>a lot.</em></h2></div><p>Who fed them? When’s that appointment?<br />Where did we put the records?<br /><strong>Let’s give all of that a home.</strong></p></div>
        <div className="lp-feature-grid">
          <article className="lp-feature lp-feature-today">
            <div className="lp-feature-icon"><PawPrint size={22} /></div><span className="lp-feature-number">01 / THE DAILY LITTLE THINGS</span>
            <h3>A calmer kind<br />of daily care.</h3><p>Meals, fresh water, walks, play. See what’s next, record what’s done, and get on with your day.</p>
            <div className="lp-mini-plan" aria-hidden="true"><span><i><Check size={13} /></i>Breakfast together<small>DONE</small></span><span><i><Heart size={13} /></i>A little play time<small>UP NEXT</small></span></div>
            <a href="#try-today" className="lp-card-link">Meet Today <ArrowUpRight size={18} /></a>
          </article>
          <article className="lp-feature lp-feature-records">
            <div className="lp-feature-icon"><ShieldCheck size={22} /></div><span className="lp-feature-number">02 / THEIR WHOLE STORY</span>
            <h3>All those details.<br /><em>Right here.</em></h3><p>Read a vaccination card, review its details, and keep records, weight and visit notes together. Less typing, more peace of mind.</p>
            <div className="lp-record-stack" aria-hidden="true"><span><Heart size={16} />Health records<ArrowUpRight size={14} /></span><span><PawPrint size={16} />Little milestones<ArrowUpRight size={14} /></span></div>
            <Link to="/login?signup=1" className="lp-card-link">A home for their history <ArrowUpRight size={18} /></Link>
          </article>
          <article className="lp-feature lp-feature-family">
            <div className="lp-feature-icon"><Users size={22} /></div><span className="lp-feature-number">03 / YOUR FAVOURITE HUMANS</span>
            <h3>Love is a<br />team effort.</h3><p>Bring family or a trusted sitter into daily care. Share instructions, record care and send photo updates, with access you control.</p>
            <div className="lp-team-art" aria-hidden="true"><span>You</span><span><PawPrint size={23} /></span><span>Your<br />people</span><i>Better, together.</i></div>
            <Link to="/login?signup=1" className="lp-card-link">Make a little care team <ArrowUpRight size={18} /></Link>
          </article>
        </div>
      </section>

      <section className="lp-demo-section" id="try-today">
        <div className="lp-shell lp-demo-layout">
          <div className="lp-demo-copy"><p className="lp-eyebrow"><span className="lp-dot" />LESS MENTAL LOAD. MORE HEAD SCRATCHES.</p><h2>A little tap.<br />A little more{' '}<br /><em>peace of mind.</em></h2><p>Meet Milo and Luna. Try their sample day, tick off a little care, and see how it feels to have everything in hand.</p><a href="#sample-care-plan" className="lp-demo-instruction"><span>01</span>Pick a pet.<span>02</span>Tap a task.<Heart size={17} /></a><div className="lp-demo-footnote"><Bell size={20} /><p>A gentle nudge, when you want one.<span>Optional daily briefings and saved health-date reminders, with preferences and quiet hours.</span></p></div></div>
          <div id="sample-care-plan" className="lp-demo-wrap"><SampleDay /><span className="lp-demo-annotation" aria-hidden="true">Go on, give it a little tap ↗</span></div>
        </div>
      </section>

      <section className="lp-product-section lp-shell lp-section">
        <div className="lp-product-copy"><p className="lp-eyebrow">A REAL HOME FOR REAL LIFE</p><h2>One day.<br />One clear <em>view.</em></h2><p>Your pets’ daily routines and care records, brought together in an app that leaves room for life.</p><div className="lp-product-points"><span><Check size={16} />All your pets, together</span><span><Check size={16} />Simple, editable care records</span><span><Check size={16} />On your phone or your computer</span></div><StartLink className="lp-button-outline">Find your everyday rhythm</StartLink></div>
        <figure className="lp-product-window"><div className="lp-window-bar"><span><i /><i /><i /></span><p>pawppy · your everyday, organised</p><PawPrint size={14} /></div><img src="/previews/today-desktop.png" width="1280" height="960" loading="lazy" alt="Pawppy Today showing Milo’s routine, care progress, and health record links" /><figcaption>Current product screen · sample account data</figcaption></figure>
      </section>

      <section className="lp-get-started lp-shell">
        <div><p className="lp-eyebrow">SMALL START. LOVELY POSSIBILITIES.</p><h2>Make yourself<br /><em>right at home.</em></h2></div>
        <ol>{[['Introduce your pet', 'A name and pet type. The rest can come later.'], ['Choose one little routine', 'Fresh water, breakfast, a walk. Start with what matters to you.'], ['Find your daily rhythm', 'Come back to Today, record care, and enjoy the time together.']].map(([title, body], index) => <li key={title}><span>0{index + 1}</span><div><h3>{title}</h3><p>{body}</p></div>{index === 0 && <Plus size={18} />}</li>)}</ol>
      </section>

      <section className="lp-faq lp-shell lp-section" id="questions">
        <div><p className="lp-eyebrow">A FEW GOOD QUESTIONS</p><h2>A little more{' '}<br /><em>clarity.</em></h2><p>Everything you need to feel at home.</p></div>
        <div className="lp-faq-list">{QUESTIONS.map(([question, answer]) => <details key={question}><summary>{question}<ChevronDown size={18} /></summary><p>{answer}</p></details>)}</div>
      </section>

      <section className="lp-closing"><div className="lp-shell"><PawPrint className="lp-closing-paw" size={32} strokeWidth={1.3} /><p className="lp-eyebrow">FOR THE ONES WHO MAKE YOUR WORLD BETTER</p><h2>Here’s to a life<br /><em>well loved.</em></h2><p>Give the everyday a home. Leave a little more room for love.</p><StartLink>Start your life with Pawppy</StartLink><span className="lp-closing-flower" aria-hidden="true">✳</span></div></section>
      <footer className="lp-footer lp-shell"><Brand /><p>A little care. A lot of love.</p><div><Link to="/privacy-policy">Privacy</Link><Link to="/terms-and-conditions">Terms</Link><Link to="/login">Sign in</Link></div><span>Made for life together.</span></footer>
    </div>
  );
}
