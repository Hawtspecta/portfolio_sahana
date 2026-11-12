"use client";

import React from "react";
import JournalSpreadCarousel, {
  JournalSpread,
} from "@/components/ui/journal-spread-carousel";

export const CERTIFICATIONS_SPREADS: JournalSpread[] = [
  {
    id: "jpmc-swe",
    label: "JPMorgan Chase — Software Engineering",
    alt: "JPMorgan Chase & Co. Software Engineering Job Simulation Certificate",
    paper: "#c96444",
    certificate: {
      count: "01",
      badge: "JOB SIMULATION",
      title: "Software Engineering Job Simulation",
      issuer: "JPMorgan Chase & Co.",
      date: "Jan 31, 2026",
      image: "/assets/certificates/jpmc-software-engineering.png",
      accentSoftHex: "#fde2b8",
      spreadBg: "linear-gradient(135deg, #c96444 0%, #9f462c 100%)",
      tapeColor: "#f2c166",
      highlights: [
        "Project setup & Spring Boot REST controller architecture.",
        "Kafka integration, H2 database, and transactional APIs.",
        "Financial data processing & backend engineering workflow.",
      ],
    },
  },
  {
    id: "google-aiml",
    label: "Google AI-ML Virtual Internship",
    alt: "Google AI-ML Certificate",
    paper: "#5d7e63",
    certificate: {
      count: "02",
      badge: "AI / ML",
      title: "Google AI-ML Virtual Internship",
      issuer: "Google · EduSkills",
      date: "2025",
      image: "/assets/certificates/google-aiml-certificate.png",
      accentSoftHex: "#d7ecd9",
      spreadBg: "linear-gradient(135deg, #5d7e63 0%, #3f5d45 100%)",
      tapeColor: "#eba082",
      highlights: [
        "Hands-on neural networks, computer vision & TensorFlow workflows.",
        "Model evaluation, object detection, and deployment pipelines.",
        "Applied machine learning problem-solving across real datasets.",
      ],
    },
  },
  {
    id: "ibm-adf",
    label: "IBM — Flutter & Dart Mobile Apps",
    alt: "IBM Coursera Flutter and Dart Developing iOS Android and Mobile Apps Certificate",
    paper: "#c98c38",
    certificate: {
      count: "03",
      badge: "MOBILE DEV",
      title: "Flutter & Dart: iOS, Android & Mobile Apps",
      issuer: "IBM · Coursera",
      date: "Sep 19, 2026",
      image: "/assets/certificates/adf-certificate.png",
      accentSoftHex: "#fce7bd",
      spreadBg: "linear-gradient(135deg, #c98c38 0%, #9d681f 100%)",
      tapeColor: "#7ab0ac",
      highlights: [
        "Cross-platform UI engineering with Flutter widgets & Dart.",
        "State management, responsive layouts & REST API integration.",
        "End-to-end iOS and Android application architecture.",
      ],
    },
  },
  {
    id: "nptel-vr",
    label: "NPTEL — Foundations of Virtual Reality",
    alt: "NPTEL Foundations of Virtual Reality Certificate",
    paper: "#8b556b",
    certificate: {
      count: "04",
      badge: "NPTEL · 12 WEEKS",
      title: "Foundations of Virtual Reality",
      issuer: "NPTEL · IIT Madras",
      date: "Jul–Oct 2025",
      image: "/assets/certificates/nptel-cert.png",
      accentSoftHex: "#f4dce6",
      spreadBg: "linear-gradient(135deg, #8b556b 0%, #65384b 100%)",
      tapeColor: "#e8c474",
      highlights: [
        "3D spatial geometry, stereoscopy & human perception in VR.",
        "Head-mounted display optics, tracking, and rendering pipelines.",
        "12-week credited engineering certification.",
      ],
    },
  },
];

export default function CertificationsBook({
  isVisible = false,
  onExpandedChange,
}: {
  isVisible?: boolean;
  onExpandedChange?: (expanded: boolean) => void;
}) {
  return (
    <div className="w-full flex flex-col items-center">
      <JournalSpreadCarousel
        spreads={CERTIFICATIONS_SPREADS}
        title="CERTIFICATIONS.TXT"
        height="clamp(430px, 64vh, 570px)"
        initialIndex={0}
        autoPlay={false}
        isVisible={isVisible}
        onExpandChange={onExpandedChange}
      />
    </div>
  );
}

