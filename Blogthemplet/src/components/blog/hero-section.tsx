"use client";

import { Button } from "@/components/ui/button";
import { ArrowRight, Play, Smartphone, Tv, Wifi } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";

export default function HeroSection() {
  const features = [
    {
      icon: Tv,
      title: "IPTV Players",
      description: "Reviews of the best IPTV applications"
    },
    {
      icon: Smartphone,
      title: "Android Boxes",
      description: "Complete guides for streaming devices"
    },
    {
      icon: Wifi,
      title: "Setup Guides",
      description: "Step-by-step installation tutorials"
    }
  ];

  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-secondary/5" />
      
      <div className="container mx-auto px-4 relative">
        <div className="text-center space-y-8 max-w-4xl mx-auto">
          {/* Main heading */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4"
          >
            <h1 className="text-4xl lg:text-6xl font-bold tracking-tight">
              Your Ultimate
              <span className="text-primary block">IPTV Guide</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the best IPTV players, streaming devices, and setup guides. 
              Stay updated with expert reviews and tutorials.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex flex-col sm:flex-row gap-4 justify-center"
          >
            <Button size="lg" className="text-lg px-8" asChild>
              <Link href="/guides/getting-started">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8" asChild>
              <Link href="/category/reviews">
                <Play className="mr-2 h-5 w-5" />
                View Reviews
              </Link>
            </Button>
          </motion.div>

          {/* Features */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 mt-16"
          >
            {features.map((feature, index) => (
              <div
                key={feature.title}
                className="flex flex-col items-center text-center space-y-4 p-6 rounded-lg bg-card/50 backdrop-blur border"
              >
                <div className="flex items-center justify-center w-12 h-12 bg-primary/10 rounded-lg">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-lg">{feature.title}</h3>
                <p className="text-muted-foreground text-sm">{feature.description}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
