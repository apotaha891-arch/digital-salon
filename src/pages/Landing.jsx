import React from 'react';
import './landing/landing.css';
import Navbar from './landing/Navbar';
import Hero from './landing/Hero';
import SocialProof from './landing/SocialProof';
import HowItWorks from './landing/HowItWorks';
import Features from './landing/Features';
import Demo from './landing/Demo';
import Pricing from './landing/Pricing';
import Testimonials from './landing/Testimonials';
import FAQ from './landing/FAQ';
import FinalCTA from './landing/FinalCTA';
import Footer from './landing/Footer';

export default function Landing() {
  return (
    <>
      <Navbar />
      <Hero />
      <SocialProof />
      <HowItWorks />
      <Features />
      <Demo />
      <Pricing />
      <Testimonials />
      <FAQ />
      <FinalCTA />
      <Footer />
    </>
  );
}
