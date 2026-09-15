import {
  Compass, ShieldCheck, Layers, Network, Building2, TrendingUp, Lightbulb, Zap,
  Crown, Award, Users, Shuffle, Anchor, Puzzle, Heart, Cpu, Factory, Package,
  Truck, Gem, PenTool, Printer, Box, Target, Type, Eye, Sparkles,
  Sprout, Link2, Wrench, Leaf, Gauge, Mail, MapPin, Send, Check,
  ArrowRight, ArrowUpRight, ArrowLeft, Menu, X, Briefcase, Handshake,
} from 'lucide-react'

/**
 * One place that maps the string keys in data/site.js to real icons, so the
 * data file stays free of component imports.
 */
const ICONS = {
  compass: Compass, shield: ShieldCheck, layers: Layers, network: Network,
  building: Building2, trending: TrendingUp, lightbulb: Lightbulb, zap: Zap,
  crown: Crown, award: Award, users: Users, shuffle: Shuffle, anchor: Anchor,
  puzzle: Puzzle, heart: Heart, cpu: Cpu, factory: Factory, package: Package,
  truck: Truck, gem: Gem, pen: PenTool, printer: Printer, box: Box,
  target: Target, type: Type, eye: Eye, sparkles: Sparkles,
  sprout: Sprout, link: Link2, wrench: Wrench, leaf: Leaf, gauge: Gauge,
  mail: Mail, pin: MapPin, send: Send, check: Check, briefcase: Briefcase,
  handshake: Handshake, arrowRight: ArrowRight, arrowUpRight: ArrowUpRight,
  arrowLeft: ArrowLeft, menu: Menu, close: X,
}

export default function Icon({ name, size = 20, ...rest }) {
  const Cmp = ICONS[name] ?? Sparkles
  return <Cmp size={size} aria-hidden="true" {...rest} />
}
