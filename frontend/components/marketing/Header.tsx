"use client"

import Link from "next/link"
import { useState } from "react"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  MobileNavHeader,
  MobileNavMenu,
  MobileNavToggle,
  NavbarButton,
} from "@/components/ui/resizable-navbar"

const navItems = [
  { name: "Features", link: "#features" },
  { name: "Privacy", link: "#privacy" },
  { name: "Docs", link: "#docs" },
]

function HeaderLogo() {
  return (
    <Link href="/" className="relative z-20 flex items-center" aria-label="Privia home">
      <span className="block dark:hidden">
        <Logo variant="brand" mode="light" className="h-16 w-auto sm:h-20" priority />
      </span>
      <span className="hidden dark:block">
        <Logo variant="brand" mode="dark" className="h-16 w-auto sm:h-20" priority />
      </span>
    </Link>
  )
}

export function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <Navbar>
      {/* Desktop navbar */}
      <NavBody>
        <HeaderLogo />
        <NavItems items={navItems} className="lg:pr-6" />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <NavbarButton href="/login" variant="dark">
            Sign in
          </NavbarButton>
          <NavbarButton href="/signup" variant="secondary">
            Request access
          </NavbarButton>
        </div>
      </NavBody>

      {/* Mobile navbar */}
      <MobileNav>
        <MobileNavHeader>
          <HeaderLogo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <MobileNavToggle isOpen={mobileOpen} onClick={() => setMobileOpen(!mobileOpen)} />
          </div>
        </MobileNavHeader>

        <MobileNavMenu isOpen={mobileOpen} onClose={() => setMobileOpen(false)}>
          {navItems.map((item) => (
            <a
              key={item.name}
              href={item.link}
              onClick={() => setMobileOpen(false)}
              className="w-full text-sm text-neutral-600 dark:text-neutral-300"
            >
              {item.name}
            </a>
          ))}
          <div className="flex w-full flex-col gap-2">
            <NavbarButton href="/login" variant="dark" className="w-full">
              Sign in
            </NavbarButton>
            <NavbarButton href="/signup" variant="secondary" className="w-full">
              Request access
            </NavbarButton>
          </div>
        </MobileNavMenu>
      </MobileNav>
    </Navbar>
  )
}
