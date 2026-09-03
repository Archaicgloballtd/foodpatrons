"use client";

import { useState } from "react";
import Link from "next/link";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { Users, Clock, MessageCircle } from "lucide-react";
import { useSession } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import type { PartyWithRestaurant } from "@/lib/parties";
import PartyChatModal from "./PartyChatModal";

const DEFAULT_CENTER = { lat: 23.7925, lng: 90.4078 }; // Gulshan/Banani, Dhaka

function partyIcon(): L.Icon {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="30" height="38" viewBox="0 0 30 38"><path d="M15 0C6.716 0 0 6.716 0 15c0 11.25 15 23 15 23s15-11.75 15-23C30 6.716 23.284 0 15 0z" fill="#F97316"/><text x="15" y="20" font-size="16" text-anchor="middle" dominant-baseline="middle">🎉</text></svg>`;
  return L.icon({
    iconUrl: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(svg),
    iconSize: [30, 38],
    iconAnchor: [15, 38],
    popupAnchor: [0, -34],
  });
}

function formatWhen(iso: string): string {
  const d = new Date(iso);
  const isToday = d.toDateString() === new Date().toDateString();
  const time = d.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return isToday ? `Today · ${time}` : `${d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" })} · ${time}`;
}

export default function PartyMap({ parties, onChanged }: { parties: PartyWithRestaurant[]; onChanged: () => void }) {
  const { user } = useSession();
  const [openChatFor, setOpenChatFor] = useState<PartyWithRestaurant | null>(null);
  const [joiningId, setJoiningId] = useState<string | null>(null);

  const located = parties.filter(
    (p): p is PartyWithRestaurant & { restaurants: NonNullable<PartyWithRestaurant["restaurants"]> & { latitude: number; longitude: number } } =>
      p.restaurants?.latitude != null && p.restaurants?.longitude != null,
  );

  const center =
    located.length > 0
      ? { lat: located.reduce((s, p) => s + p.restaurants.latitude, 0) / located.length, lng: located.reduce((s, p) => s + p.restaurants.longitude, 0) / located.length }
      : DEFAULT_CENTER;

  async function handleJoin(party: PartyWithRestaurant) {
    if (!user) return;
    setJoiningId(party.id);
    const { error } = await supabase.from("party_members").insert({ party_id: party.id, user_id: user.id });
    setJoiningId(null);
    if (!error) {
      onChanged();
      setOpenChatFor(party);
    }
  }

  return (
    <>
      <div className="h-72 w-full overflow-hidden rounded-2xl border border-border sm:h-96">
        <MapContainer center={center} zoom={13} scrollWheelZoom className="h-full w-full">
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {located.map((party) => {
            const isMember = user ? party.party_members.some((m) => m.user_id === user.id) : false;
            const isFull = party.max_members !== null && party.party_members.length >= party.max_members;
            return (
              <Marker key={party.id} position={[party.restaurants.latitude, party.restaurants.longitude]} icon={partyIcon()}>
                <Popup minWidth={220} maxWidth={240}>
                  <div>
                    <p className="font-bold leading-snug text-zinc-900">{party.title}</p>
                    <Link href={`/restaurant/${party.restaurants.id}`} className="text-xs text-zinc-500 hover:underline">
                      {party.restaurants.name}
                    </Link>
                    <p className="mt-1.5 flex items-center gap-1 text-xs text-zinc-600">
                      <Clock className="h-3 w-3" />
                      {formatWhen(party.scheduled_for)}
                    </p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-zinc-600">
                      <Users className="h-3 w-3" />
                      {party.party_members.length}
                      {party.max_members ? `/${party.max_members}` : ""} joined
                    </p>
                    <div className="mt-2.5">
                      {isMember ? (
                        <button
                          type="button"
                          onClick={() => setOpenChatFor(party)}
                          className="flex w-full items-center justify-center gap-1 rounded-full bg-[#22C55E] px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90"
                        >
                          <MessageCircle className="h-3 w-3" />
                          Open chat
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleJoin(party)}
                          disabled={!user || isFull || joiningId === party.id}
                          className="w-full rounded-full bg-[#F97316] px-3 py-1.5 text-[11px] font-semibold text-white hover:opacity-90 disabled:opacity-50"
                        >
                          {isFull ? "Full" : joiningId === party.id ? "Joining…" : !user ? "Sign in to join" : "Join"}
                        </button>
                      )}
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>

      {openChatFor && user && (
        <PartyChatModal
          party={openChatFor}
          userId={user.id}
          onClose={() => setOpenChatFor(null)}
          onLeft={() => {
            setOpenChatFor(null);
            onChanged();
          }}
        />
      )}
    </>
  );
}
