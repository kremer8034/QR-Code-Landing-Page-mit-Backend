'use client';

import { useState } from 'react';
import { Button, Field, Input, Textarea, Select } from '@/components/ui';
import { IconPicker } from '@/components/IconPicker';
import { VehiclePicker } from '@/components/VehiclePicker';
import { CONTENT_TYPES, defaultIconFor } from '@/lib/content';
import type { ContentType } from '@/lib/types';

interface Template { key: string; label: string }
interface CustomIcon { value: string; url: string; name: string }
interface GroupOption { id: string; name: string }
interface VehicleOption { id: string; label: string; sub?: string }

export interface LinkFormInitial {
  id?: string;
  type: ContentType;
  label: string;
  description: string;
  url: string;
  value: string;
  body: string;
  icon: string;
  hasFile: boolean;
}

export function LinkForm({
  action,
  submitLabel,
  templates,
  customIcons,
  groups,
  vehicles,
  initial,
  selectedGroups,
  selectedVehicles,
  isGlobal,
}: {
  action: (formData: FormData) => void;
  submitLabel: string;
  templates: Template[];
  customIcons: CustomIcon[];
  groups: GroupOption[];
  vehicles: VehicleOption[];
  initial?: LinkFormInitial;
  selectedGroups: string[];
  selectedVehicles: string[];
  isGlobal: boolean;
}) {
  const editing = Boolean(initial?.id);
  const [type, setType] = useState<ContentType>(initial?.type ?? 'link');

  const isButtonType = ['link', 'pdf', 'phone', 'email', 'address'].includes(type);

  const labelText =
    type === 'text' ? 'Überschrift (optional)' : type === 'image' ? 'Beschriftung (optional)' : 'Bezeichnung';

  return (
    <form action={action} className="space-y-4">
      {initial?.id ? <input type="hidden" name="id" value={initial.id} /> : null}

      <Field label="Typ">
        <Select name="type" value={type} onChange={(e) => setType(e.target.value as ContentType)}>
          {CONTENT_TYPES.map((t) => (
            <option key={t.type} value={t.type}>{t.label}</option>
          ))}
        </Select>
      </Field>

      <Field label={labelText}>
        <Input name="label" defaultValue={initial?.label ?? ''} required={type !== 'text' && type !== 'image'} placeholder={type === 'text' ? 'z. B. Wichtiger Hinweis' : ''} />
      </Field>

      {type === 'link' ? (
        <Field label="URL">
          <Input name="url" type="url" defaultValue={initial?.url ?? ''} required placeholder="https://…" />
        </Field>
      ) : null}

      {type === 'phone' ? (
        <Field label="Telefonnummer" hint="Beim Antippen öffnet sich die Telefon-App.">
          <Input name="value" type="tel" defaultValue={initial?.value ?? ''} required placeholder="+49 9371 123456" />
        </Field>
      ) : null}

      {type === 'email' ? (
        <Field label="E-Mail-Adresse" hint="Beim Antippen öffnet sich die Mail-App.">
          <Input name="value" type="email" defaultValue={initial?.value ?? ''} required placeholder="name@brk.de" />
        </Field>
      ) : null}

      {type === 'address' ? (
        <Field label="Adresse" hint="Beim Antippen öffnet sich die Karten-/Navigations-App.">
          <Input name="value" defaultValue={initial?.value ?? ''} required placeholder="Musterstraße 1, 63897 Musterstadt" />
        </Field>
      ) : null}

      {type === 'text' ? (
        <Field label="Text">
          <Textarea name="body" rows={4} defaultValue={initial?.body ?? ''} required placeholder="Dieser Text wird direkt auf der Seite angezeigt." />
        </Field>
      ) : null}

      {type === 'pdf' ? (
        <Field label="PDF-Datei" hint={editing && initial?.hasFile ? 'Eine Datei ist hinterlegt. Leer lassen, um sie beizubehalten.' : 'PDF auswählen.'}>
          <input type="file" name="file" accept="application/pdf,.pdf" required={!editing || !initial?.hasFile}
            className="block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-gray-900 file:px-4 file:py-2.5 file:text-white" />
        </Field>
      ) : null}

      {type === 'image' ? (
        <Field label="Bilddatei" hint={editing && initial?.hasFile ? 'Ein Bild ist hinterlegt. Leer lassen, um es beizubehalten.' : 'Bild auswählen.'}>
          <input type="file" name="file" accept="image/*" required={!editing || !initial?.hasFile}
            className="block w-full text-sm file:mr-4 file:rounded-xl file:border-0 file:bg-gray-900 file:px-4 file:py-2.5 file:text-white" />
        </Field>
      ) : null}

      {isButtonType ? (
        <Field label="Beschreibung (optional)">
          <Input name="description" defaultValue={initial?.description ?? ''} placeholder="Kurztext unter dem Button" />
        </Field>
      ) : null}

      {type !== 'image' ? (
        <Field label="Symbol">
          <IconPicker
            key={editing ? 'edit' : type}
            name="icon"
            defaultValue={editing ? (initial?.icon ?? defaultIconFor(type)) : defaultIconFor(type)}
            templates={templates}
            customIcons={customIcons}
          />
        </Field>
      ) : null}

      <div className="rounded-xl bg-gray-50 ring-1 ring-gray-200 p-3 space-y-3">
        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" name="scope_global" defaultChecked={isGlobal} className="h-4 w-4" />
          Auf <strong>allen</strong> Landingpages anzeigen
        </label>
        <div>
          <div className="text-xs font-semibold text-gray-500 uppercase mb-1.5">Für Gruppen</div>
          {groups.length === 0 ? (
            <p className="text-xs text-gray-400">Keine Gruppen vorhanden.</p>
          ) : (
            <div className="grid grid-cols-2 gap-1.5">
              {groups.map((g) => (
                <label key={g.id} className="flex items-center gap-2 text-sm">
                  <input type="checkbox" name="group_ids" value={g.id} defaultChecked={selectedGroups.includes(g.id)} className="h-4 w-4" />
                  <span className="truncate">{g.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
        <VehiclePicker name="vehicle_ids" vehicles={vehicles} selected={selectedVehicles} />
      </div>

      <Button type="submit">{submitLabel}</Button>
    </form>
  );
}
