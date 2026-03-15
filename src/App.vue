<template>
  <div class="min-h-screen bg-gray-50 p-4">
    <div class="max-w-full mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <h1 class="text-xl font-bold text-gray-800">Project Plan - Gantt Chart</h1>
        <div class="flex items-center gap-2">
          <span v-if="lastAction" class="text-xs text-gray-400 mr-2">{{ lastAction }}</span>
          <span class="text-xs text-gray-400">{{ events.length }} events | {{ flatRowCount }} rows</span>
          <button
            class="text-xs px-2 py-1 rounded"
            :class="showOptions ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-700'"
            @click="showOptions = !showOptions"
          >
            {{ showOptions ? 'Hide Panel' : 'Options Panel' }}
          </button>
        </div>
      </div>

      <!-- Options Panel -->
      <div v-if="showOptions" class="mb-3 bg-white rounded-lg shadow-sm border overflow-hidden">
        <!-- Tabs -->
        <div class="flex border-b bg-gray-50">
          <button
            v-for="tab in tabs"
            :key="tab.id"
            class="px-4 py-2 text-xs font-medium border-b-2 transition-colors"
            :class="activeTab === tab.id
              ? 'border-blue-500 text-blue-600 bg-white'
              : 'border-transparent text-gray-500 hover:text-gray-700'"
            @click="activeTab = tab.id"
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="p-4">
          <!-- TAB: Display -->
          <div v-if="activeTab === 'display'" class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <label class="block text-xs text-gray-500 mb-1">Cell Width: {{ options.cellWidth }}px</label>
              <input type="range" v-model.number="options.cellWidth" min="30" max="200" step="5" class="w-full" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Row Height: {{ options.rowHeight }}px</label>
              <input type="range" v-model.number="options.rowHeight" min="25" max="100" step="5" class="w-full" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Scale: {{ options.scale }}h</label>
              <input type="range" v-model.number="options.scale" min="1" max="168" step="1" class="w-full" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Scroll Speed: {{ options.scrollSpeed }}</label>
              <input type="range" v-model.number="options.scrollSpeed" min="1" max="10" step="1" class="w-full" />
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Chart Height</label>
              <select v-model="chartHeight" class="text-xs border rounded px-2 py-1 w-full">
                <option value="400">400px</option>
                <option value="500">500px</option>
                <option value="600">600px</option>
                <option value="700">700px</option>
                <option value="800">800px</option>
              </select>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="showTime" v-model="options.showCurrentTime" />
              <label for="showTime" class="text-xs text-gray-600">Current Time Line</label>
            </div>
            <div class="flex items-center gap-2">
              <input type="checkbox" id="showHover" v-model="options.showHoverLine" />
              <label for="showHover" class="text-xs text-gray-600">Hover Line</label>
            </div>
            <div>
              <label class="block text-xs text-gray-500 mb-1">Top Header Level</label>
              <select v-model="topLevel" class="text-xs border rounded px-2 py-1 w-full">
                <option value="">None</option>
                <option value="days">Days</option>
                <option value="weeks">Weeks</option>
                <option value="months">Months</option>
              </select>
            </div>
          </div>

          <!-- TAB: Dates -->
          <div v-if="activeTab === 'dates'" class="space-y-4 text-sm">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Start Date</label>
                <input type="date" :value="formatDateInput(projectStart)" @change="setStartDate($event)" class="text-xs border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">End Date</label>
                <input type="date" :value="formatDateInput(projectEnd)" @change="setEndDate($event)" class="text-xs border rounded px-2 py-1 w-full" />
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Duration</label>
                <span class="text-xs text-gray-700">{{ daysBetween }} days</span>
              </div>
              <div>
                <label class="block text-xs text-gray-500 mb-1">Quick Range</label>
                <select class="text-xs border rounded px-2 py-1 w-full" @change="applyDatePreset($event)">
                  <option value="">Choose...</option>
                  <option value="1w">1 Week</option>
                  <option value="2w">2 Weeks</option>
                  <option value="1m">1 Month</option>
                  <option value="3m">3 Months</option>
                  <option value="6m">6 Months</option>
                  <option value="1y">1 Year</option>
                </select>
              </div>
            </div>
            <div class="flex gap-2">
              <button class="text-xs px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600" @click="fitToEvents">Fit to Events</button>
              <button class="text-xs px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300" @click="shiftTimeline(-7)">-1 Week</button>
              <button class="text-xs px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300" @click="shiftTimeline(7)">+1 Week</button>
              <button class="text-xs px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300" @click="shiftTimeline(-30)">-1 Month</button>
              <button class="text-xs px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300" @click="shiftTimeline(30)">+1 Month</button>
            </div>
          </div>

          <!-- TAB: Events -->
          <div v-if="activeTab === 'events'" class="space-y-4 text-sm">
            <!-- Selected event editor -->
            <div v-if="selectedEvent" class="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-bold text-blue-700">Editing: {{ selectedEvent.meta?.title ?? selectedEvent.id }}</span>
                <button class="text-xs text-red-500 hover:text-red-700" @click="removeEvent(selectedEvent!.id)">Delete</button>
              </div>
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Title</label>
                  <input type="text" :value="selectedEvent.meta?.title" @input="updateSelectedMeta('title', ($event.target as HTMLInputElement).value)" class="text-xs border rounded px-2 py-1 w-full" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Description</label>
                  <input type="text" :value="selectedEvent.meta?.description" @input="updateSelectedMeta('description', ($event.target as HTMLInputElement).value)" class="text-xs border rounded px-2 py-1 w-full" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Start</label>
                  <input type="datetime-local" :value="formatDateTimeInput(selectedEvent.start)" @change="updateSelectedDate('start', $event)" class="text-xs border rounded px-2 py-1 w-full" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">End</label>
                  <input type="datetime-local" :value="formatDateTimeInput(selectedEvent.end)" @change="updateSelectedDate('end', $event)" class="text-xs border rounded px-2 py-1 w-full" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Progress: {{ selectedEvent.progress ?? 0 }}%</label>
                  <input type="range" :value="selectedEvent.progress ?? 0" @input="updateSelectedField('progress', Number(($event.target as HTMLInputElement).value))" min="0" max="100" step="5" class="w-full" />
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Row</label>
                  <select :value="selectedEvent.rowId" @change="updateSelectedField('rowId', ($event.target as HTMLSelectElement).value)" class="text-xs border rounded px-2 py-1 w-full">
                    <option v-for="r in allRowIds" :key="r" :value="r">{{ r }}</option>
                  </select>
                </div>
                <div>
                  <label class="block text-xs text-gray-500 mb-1">Color</label>
                  <select :value="selectedEvent.meta?.class" @change="updateSelectedMeta('class', ($event.target as HTMLSelectElement).value)" class="text-xs border rounded px-2 py-1 w-full">
                    <option v-for="c in eventColors" :key="c" :value="c">{{ c.replace(' rounded', '').replace('bg-', '') }}</option>
                  </select>
                </div>
                <div class="flex items-center gap-2">
                  <input type="checkbox" :checked="selectedEvent.isMilestone" @change="updateSelectedField('isMilestone', ($event.target as HTMLInputElement).checked)" />
                  <label class="text-xs text-gray-600">Milestone</label>
                </div>
              </div>
            </div>
            <div v-else class="text-xs text-gray-400 p-3 bg-gray-50 rounded">
              Click an event in the chart to edit it here.
            </div>

            <!-- Bulk actions & add -->
            <div class="flex flex-wrap gap-2 border-t pt-3">
              <button class="text-xs px-3 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600" @click="addSampleEvent">+ Random Event</button>
              <button class="text-xs px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600" @click="addMilestone">+ Milestone</button>
              <button class="text-xs px-3 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600" @click="generateBatch(5)">+ 5 Random</button>
              <button class="text-xs px-3 py-1 rounded bg-indigo-500 text-white hover:bg-indigo-600" @click="generateBatch(20)">+ 20 Random</button>
              <div class="border-l mx-1" />
              <button class="text-xs px-3 py-1 rounded bg-amber-500 text-white hover:bg-amber-600" @click="randomizeProgress">Randomize Progress</button>
              <button class="text-xs px-3 py-1 rounded bg-orange-500 text-white hover:bg-orange-600" @click="clearAllDependencies">Clear Dependencies</button>
              <button class="text-xs px-3 py-1 rounded bg-red-500 text-white hover:bg-red-600" @click="clearAllEvents">Clear All Events</button>
              <button class="text-xs px-3 py-1 rounded bg-gray-700 text-white hover:bg-gray-800" @click="resetToDemo">Reset Demo</button>
            </div>

            <!-- Event list -->
            <div class="max-h-40 overflow-auto border rounded">
              <table class="w-full text-xs">
                <thead class="bg-gray-50 sticky top-0">
                  <tr>
                    <th class="text-left p-1.5 font-medium text-gray-500">Title</th>
                    <th class="text-left p-1.5 font-medium text-gray-500">Row</th>
                    <th class="text-left p-1.5 font-medium text-gray-500">Start</th>
                    <th class="text-left p-1.5 font-medium text-gray-500">End</th>
                    <th class="text-left p-1.5 font-medium text-gray-500">Progress</th>
                    <th class="text-left p-1.5 font-medium text-gray-500">Type</th>
                    <th class="p-1.5"></th>
                  </tr>
                </thead>
                <tbody>
                  <tr
                    v-for="evt in events"
                    :key="evt.id"
                    class="border-t hover:bg-blue-50 cursor-pointer"
                    :class="{ 'bg-blue-50': evt.id === ganttRef?.selectedEventId }"
                    @click="selectEventById(evt.id)"
                  >
                    <td class="p-1.5">{{ evt.meta?.title ?? evt.id }}</td>
                    <td class="p-1.5 text-gray-400">{{ evt.rowId }}</td>
                    <td class="p-1.5 text-gray-400">{{ shortDate(evt.start) }}</td>
                    <td class="p-1.5 text-gray-400">{{ shortDate(evt.end) }}</td>
                    <td class="p-1.5">
                      <div class="w-12 bg-gray-200 rounded-full h-1.5">
                        <div class="bg-blue-500 h-1.5 rounded-full" :style="{ width: `${evt.progress ?? 0}%` }" />
                      </div>
                    </td>
                    <td class="p-1.5 text-gray-400">{{ evt.isMilestone ? 'Milestone' : 'Task' }}</td>
                    <td class="p-1.5">
                      <button class="text-red-400 hover:text-red-600" @click.stop="removeEvent(evt.id)">x</button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <!-- TAB: Rows & Groups -->
          <div v-if="activeTab === 'rows'" class="space-y-4 text-sm">
            <div class="flex flex-wrap gap-2">
              <button class="text-xs px-3 py-1 rounded bg-emerald-500 text-white hover:bg-emerald-600" @click="addGroup">+ Add Group</button>
              <button class="text-xs px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600" @click="addRowToFirstGroup">+ Add Row</button>
              <button class="text-xs px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300" @click="expandAll">Expand All</button>
              <button class="text-xs px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300" @click="collapseAll">Collapse All</button>
            </div>
            <!-- Group/row tree -->
            <div class="border rounded max-h-48 overflow-auto">
              <div v-for="(group, gi) in rows" :key="group.id" class="border-b last:border-b-0">
                <div class="flex items-center justify-between p-2 bg-gray-50 hover:bg-gray-100">
                  <div class="flex items-center gap-2">
                    <span class="font-medium text-xs">{{ group.label }}</span>
                    <span class="text-xs text-gray-400">({{ group.children?.length ?? 0 }} items)</span>
                  </div>
                  <div class="flex gap-1">
                    <button class="text-xs text-blue-500 hover:text-blue-700" @click="addRowToGroup(gi)">+ row</button>
                    <button class="text-xs text-red-400 hover:text-red-600" @click="removeGroup(gi)">remove</button>
                  </div>
                </div>
                <div v-if="group.children" class="pl-4">
                  <div
                    v-for="(child, ci) in group.children"
                    :key="'child' in child ? (child as any).id : (child as any).id"
                    class="flex items-center justify-between p-1.5 text-xs border-t hover:bg-gray-50"
                  >
                    <span class="text-gray-600">
                      {{ isGroup(child) ? '> ' + (child as GanttGroup).label : (child as GanttRow).columns.join(' | ') }}
                    </span>
                    <button class="text-red-400 hover:text-red-600" @click="removeRowFromGroup(gi, ci)">x</button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- TAB: Theme -->
          <div v-if="activeTab === 'theme'" class="space-y-4 text-sm">
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <label class="block text-xs text-gray-500 mb-1">Preset</label>
                <select v-model="currentTheme" class="text-xs border rounded px-2 py-1 w-full">
                  <option v-for="(_, key) in themes" :key="key" :value="key">{{ key }}</option>
                </select>
              </div>
              <div v-for="(varName, idx) in themeVarNames" :key="idx">
                <label class="block text-xs text-gray-500 mb-1">{{ varName.replace('--gantt-', '') }}</label>
                <div class="flex gap-1 items-center">
                  <input
                    type="color"
                    :value="customTheme[varName] || getDefaultColor(varName)"
                    @input="setCustomColor(varName, ($event.target as HTMLInputElement).value)"
                    class="w-6 h-6 border rounded cursor-pointer"
                  />
                  <span class="text-xs text-gray-400">{{ customTheme[varName] || getDefaultColor(varName) }}</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2 border-t pt-3">
              <button class="text-xs px-3 py-1 rounded bg-gray-200 text-gray-700 hover:bg-gray-300" @click="resetTheme">Reset Colors</button>
              <button class="text-xs px-3 py-1 rounded bg-blue-500 text-white hover:bg-blue-600" @click="copyTheme">Copy Theme CSS</button>
            </div>
          </div>

          <!-- TAB: Presets -->
          <div v-if="activeTab === 'presets'" class="space-y-4 text-sm">
            <p class="text-xs text-gray-500">Load a completely different demo dataset.</p>
            <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
              <button
                v-for="preset in presets"
                :key="preset.id"
                class="text-left p-3 border rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-colors"
                @click="loadPreset(preset.id)"
              >
                <div class="text-xs font-bold text-gray-700">{{ preset.label }}</div>
                <div class="text-xs text-gray-400 mt-0.5">{{ preset.description }}</div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Gantt Chart -->
      <div :style="mergedTheme" :class="{ 'h-[400px]': chartHeight === '400', 'h-[500px]': chartHeight === '500', 'h-[600px]': chartHeight === '600', 'h-[700px]': chartHeight === '700', 'h-[800px]': chartHeight === '800' }">
        <GanttChart
          ref="ganttRef"
          :start="projectStart"
          :end="projectEnd"
          :events="events"
          :rows="rows"
          :headers="headers"
          :options="options"
          @event-click="onEventClick"
          @event-drag-end="onDragEnd"
          @event-resize-end="onResizeEnd"
          @cell-click="onCellClick"
          @group-toggle="onGroupToggle"
          @scale-change="onScaleChange"
          @event-select="onEventSelect"
          @event-delete="onEventDelete"
        >
          <template #event="{ event }">
            <div class="flex flex-col truncate px-2 py-1 text-xs text-white">
              <div class="font-bold">{{ event.meta?.title }}</div>
              <div v-if="event.meta?.description" class="text-white/70 truncate">{{ event.meta.description }}</div>
              <div v-if="event.progress != null && event.progress > 0" class="text-white/50">{{ event.progress }}%</div>
            </div>
          </template>
        </GanttChart>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import type {
  GanttEvent,
  GanttGroup,
  GanttRow,
  GanttOptions,
  EventClickPayload,
  EventDragPayload,
  EventResizePayload,
  CellClickPayload,
  ScaleUnit,
} from "./types/gantt";
import { isGanttGroup, flattenGroups } from "./types/gantt";
import GanttChart from "./components/GanttChart.vue";

const isGroup = isGanttGroup;
const ganttRef = ref<InstanceType<typeof GanttChart>>();
const showOptions = ref(true);
const lastAction = ref("");
const activeTab = ref("display");
const chartHeight = ref("600");

const tabs = [
  { id: "display", label: "Display" },
  { id: "dates", label: "Dates & Range" },
  { id: "events", label: "Events" },
  { id: "rows", label: "Rows & Groups" },
  { id: "theme", label: "Theme" },
  { id: "presets", label: "Presets" },
];

// ──────────── DATES ────────────
const projectStart = ref(new Date(2024, 2, 1, 0, 0));
const projectEnd = ref(new Date(2024, 3, 1, 0, 0));
const headers = ref(["Task", "Owner"]);

const daysBetween = computed(() =>
  Math.round((projectEnd.value.getTime() - projectStart.value.getTime()) / 86400000),
);

const flatRowCount = computed(() => flattenGroups(rows).length);

function formatDateInput(d: Date): string {
  return d.toISOString().split("T")[0];
}

function formatDateTimeInput(d: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function shortDate(d: Date): string {
  return `${d.getDate()}/${d.getMonth() + 1}`;
}

function setStartDate(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  if (val) projectStart.value = new Date(val + "T00:00");
}

function setEndDate(e: Event) {
  const val = (e.target as HTMLInputElement).value;
  if (val) projectEnd.value = new Date(val + "T00:00");
}

function applyDatePreset(e: Event) {
  const val = (e.target as HTMLSelectElement).value;
  const start = new Date(projectStart.value);
  const map: Record<string, number> = { "1w": 7, "2w": 14, "1m": 31, "3m": 92, "6m": 183, "1y": 365 };
  if (map[val]) {
    projectEnd.value = new Date(start.getTime() + map[val] * 86400000);
    if (map[val] >= 92) options.scale = 168;
    else if (map[val] >= 31) options.scale = 24;
    else options.scale = 12;
    lastAction.value = `Range: ${val}`;
  }
}

function shiftTimeline(days: number) {
  projectStart.value = new Date(projectStart.value.getTime() + days * 86400000);
  projectEnd.value = new Date(projectEnd.value.getTime() + days * 86400000);
  lastAction.value = `Shifted ${days > 0 ? "+" : ""}${days} days`;
}

function fitToEvents() {
  if (events.value.length === 0) return;
  let min = Infinity, max = -Infinity;
  for (const e of events.value) {
    if (e.start.getTime() < min) min = e.start.getTime();
    if (e.end.getTime() > max) max = e.end.getTime();
  }
  const padding = 86400000;
  projectStart.value = new Date(min - padding);
  projectEnd.value = new Date(max + padding);
  lastAction.value = "Fit to events";
}

// ──────────── OPTIONS ────────────
const topLevel = ref<ScaleUnit | "">("weeks");

const options = reactive<GanttOptions>({
  cellWidth: 80,
  rowHeight: 45,
  scale: 24,
  scaleUnit: "days",
  scrollSpeed: 3,
  showCurrentTime: false,
  showHoverLine: true,
  timelineLevels: [{ unit: "weeks", format: "Week dd" }],
});

watch(topLevel, (val) => {
  options.timelineLevels = val ? [{ unit: val }] : [];
});

// ──────────── THEME ────────────
const currentTheme = ref("default");
const customTheme = reactive<Record<string, string>>({});

const themeVarNames = [
  "--gantt-bg", "--gantt-header-bg", "--gantt-header-bg-alt", "--gantt-header-text",
  "--gantt-sidebar-bg", "--gantt-group-bg", "--gantt-group-text", "--gantt-text-muted",
  "--gantt-cell-bg", "--gantt-grid-border",
];

const defaultColors: Record<string, string> = {
  "--gantt-bg": "#f3f4f6", "--gantt-header-bg": "#64748b", "--gantt-header-bg-alt": "#475569",
  "--gantt-header-text": "#f3f4f6", "--gantt-sidebar-bg": "#d1d5db", "--gantt-group-bg": "#f9fafb",
  "--gantt-group-text": "#4b5563", "--gantt-text-muted": "#9ca3af", "--gantt-cell-bg": "#ffffff",
  "--gantt-grid-border": "#e5e7eb",
};

const themes: Record<string, Record<string, string>> = {
  default: {},
  dark: {
    "--gantt-bg": "#1e293b", "--gantt-header-bg": "#334155", "--gantt-header-bg-alt": "#1e293b",
    "--gantt-header-text": "#e2e8f0", "--gantt-sidebar-bg": "#334155", "--gantt-group-bg": "#1e293b",
    "--gantt-group-text": "#94a3b8", "--gantt-text-muted": "#64748b", "--gantt-cell-bg": "#0f172a",
    "--gantt-grid-border": "#334155",
  },
  midnight: {
    "--gantt-bg": "#0c0a1d", "--gantt-header-bg": "#1a1640", "--gantt-header-bg-alt": "#12102e",
    "--gantt-header-text": "#c4b5fd", "--gantt-sidebar-bg": "#1a1640", "--gantt-group-bg": "#12102e",
    "--gantt-group-text": "#a78bfa", "--gantt-text-muted": "#6d5cae", "--gantt-cell-bg": "#0c0a1d",
    "--gantt-grid-border": "#2e2763",
  },
  ocean: {
    "--gantt-bg": "#ecfdf5", "--gantt-header-bg": "#065f46", "--gantt-header-bg-alt": "#064e3b",
    "--gantt-header-text": "#d1fae5", "--gantt-sidebar-bg": "#a7f3d0", "--gantt-group-bg": "#d1fae5",
    "--gantt-group-text": "#065f46", "--gantt-text-muted": "#6b7280", "--gantt-cell-bg": "#f0fdf4",
    "--gantt-grid-border": "#a7f3d0",
  },
  sunset: {
    "--gantt-bg": "#fff7ed", "--gantt-header-bg": "#9a3412", "--gantt-header-bg-alt": "#7c2d12",
    "--gantt-header-text": "#fed7aa", "--gantt-sidebar-bg": "#fdba74", "--gantt-group-bg": "#ffedd5",
    "--gantt-group-text": "#9a3412", "--gantt-text-muted": "#9ca3af", "--gantt-cell-bg": "#fffbeb",
    "--gantt-grid-border": "#fed7aa",
  },
  nord: {
    "--gantt-bg": "#2e3440", "--gantt-header-bg": "#3b4252", "--gantt-header-bg-alt": "#2e3440",
    "--gantt-header-text": "#d8dee9", "--gantt-sidebar-bg": "#3b4252", "--gantt-group-bg": "#434c5e",
    "--gantt-group-text": "#88c0d0", "--gantt-text-muted": "#7b88a1", "--gantt-cell-bg": "#2e3440",
    "--gantt-grid-border": "#434c5e",
  },
};

function getDefaultColor(name: string): string {
  const preset = themes[currentTheme.value];
  return preset?.[name] || defaultColors[name] || "#cccccc";
}

function setCustomColor(name: string, value: string) {
  customTheme[name] = value;
  currentTheme.value = "custom";
}

function resetTheme() {
  for (const key of themeVarNames) delete customTheme[key];
  currentTheme.value = "default";
}

function copyTheme() {
  const vars = themeVarNames
    .map((v) => `  ${v}: ${customTheme[v] || getDefaultColor(v)};`)
    .join("\n");
  navigator.clipboard.writeText(`.gantt-chart {\n${vars}\n}`);
  lastAction.value = "Theme CSS copied!";
}

const mergedTheme = computed(() => {
  const base = themes[currentTheme.value] ?? {};
  return { ...base, ...customTheme };
});

// ──────────── ROWS ────────────
const rows = reactive<GanttGroup[]>([
  {
    id: "design", label: "Design Phase",
    children: [
      { id: "wireframes", columns: ["Wireframes", "Alice"] },
      { id: "mockups", columns: ["UI Mockups", "Alice"] },
      { id: "review-design", columns: ["Design Review", "Team"] },
    ],
  },
  {
    id: "development", label: "Development Phase",
    children: [
      { id: "api", columns: ["API Development", "Bob"] },
      { id: "frontend", columns: ["Frontend Build", "Carol"] },
      {
        id: "integration", label: "Integration",
        children: [
          { id: "api-integration", columns: ["API Integration", "Bob"] },
          { id: "ui-integration", columns: ["UI Integration", "Carol"] },
        ],
      },
    ],
  },
  {
    id: "qa", label: "QA Phase",
    children: [
      { id: "testing", columns: ["Testing", "Dave"] },
      { id: "bugfix", columns: ["Bug Fixes", "Bob & Carol"] },
    ],
  },
  {
    id: "launch", label: "Launch",
    children: [
      { id: "deploy", columns: ["Deployment", "DevOps"] },
      { id: "monitoring", columns: ["Monitoring", "Team"] },
    ],
  },
]);

const allRowIds = computed(() => {
  const flat = flattenGroups(rows);
  return flat.filter((r) => !r.isGroup).map((r) => r.id);
});

let groupCounter = 0;
let rowCounter = 0;

function addGroup() {
  groupCounter++;
  rows.push({
    id: `group-${Date.now()}`,
    label: `New Group ${groupCounter}`,
    children: [],
  });
  lastAction.value = `Added group ${groupCounter}`;
}

function removeGroup(idx: number) {
  const removed = rows.splice(idx, 1);
  lastAction.value = `Removed group: ${removed[0]?.label}`;
}

function addRowToGroup(groupIdx: number) {
  rowCounter++;
  const id = `row-${Date.now()}-${rowCounter}`;
  const group = rows[groupIdx];
  if (!group.children) group.children = [];
  group.children.push({ id, columns: [`Task ${rowCounter}`, "Unassigned"] });
  lastAction.value = `Added row to ${group.label}`;
}

function addRowToFirstGroup() {
  if (rows.length > 0) addRowToGroup(0);
}

function removeRowFromGroup(groupIdx: number, childIdx: number) {
  rows[groupIdx].children?.splice(childIdx, 1);
  lastAction.value = "Removed row";
}

function expandAll() {
  function expand(items: (GanttRow | GanttGroup)[]) {
    for (const item of items) {
      if (isGanttGroup(item)) {
        item.collapsed = false;
        if (item.children) expand(item.children);
      }
    }
  }
  expand(rows);
  lastAction.value = "Expanded all";
}

function collapseAll() {
  for (const g of rows) g.collapsed = true;
  lastAction.value = "Collapsed all";
}

// ──────────── EVENTS ────────────
let eventCounter = 0;

const eventColors = [
  "bg-blue-500 rounded", "bg-emerald-500 rounded", "bg-orange-500 rounded",
  "bg-purple-500 rounded", "bg-teal-500 rounded", "bg-pink-500 rounded",
  "bg-indigo-500 rounded", "bg-amber-500 rounded", "bg-rose-500 rounded",
  "bg-cyan-500 rounded", "bg-lime-500 rounded", "bg-sky-500 rounded",
];

const events = ref<GanttEvent[]>([]);

const selectedEvent = computed(() => {
  const id = ganttRef.value?.selectedEventId;
  if (!id) return null;
  return events.value.find((e) => e.id === id) ?? null;
});

function selectEventById(id: string) {
  if (ganttRef.value) {
    ganttRef.value.selectedEventId = id;
  }
}

function addEvent(event: GanttEvent) {
  events.value.push(event);
  lastAction.value = `Added: ${event.meta?.title ?? event.id}`;
}

function removeEvent(eventId: string) {
  const idx = events.value.findIndex((e) => e.id === eventId);
  if (idx !== -1) {
    const removed = events.value[idx];
    events.value.splice(idx, 1);
    for (const evt of events.value) {
      if (evt.dependencies) evt.dependencies = evt.dependencies.filter((d) => d !== eventId);
    }
    lastAction.value = `Removed: ${removed.meta?.title ?? removed.id}`;
  }
}

function addSampleEvent() {
  eventCounter++;
  const ids = allRowIds.value;
  if (ids.length === 0) return;
  const rowId = ids[eventCounter % ids.length];
  const dayOffset = Math.floor(Math.random() * (daysBetween.value - 3)) + 1;
  const duration = Math.floor(Math.random() * 3) + 1;
  const color = eventColors[eventCounter % eventColors.length];

  addEvent({
    id: `evt-${Date.now()}-${eventCounter}`,
    rowId,
    start: new Date(projectStart.value.getTime() + dayOffset * 86400000),
    end: new Date(projectStart.value.getTime() + (dayOffset + duration) * 86400000),
    progress: Math.floor(Math.random() * 100),
    meta: { title: `Task #${eventCounter}`, description: "Auto-generated", class: color },
  });
}

function addMilestone() {
  eventCounter++;
  const ids = allRowIds.value;
  if (ids.length === 0) return;
  const rowId = ids[eventCounter % ids.length];
  const dayOffset = Math.floor(Math.random() * daysBetween.value) + 1;
  const d = new Date(projectStart.value.getTime() + dayOffset * 86400000);

  addEvent({
    id: `ms-${Date.now()}-${eventCounter}`,
    rowId,
    start: d,
    end: d,
    isMilestone: true,
    meta: { title: `Milestone #${eventCounter}`, class: "bg-yellow-500" },
  });
}

function generateBatch(count: number) {
  for (let i = 0; i < count; i++) addSampleEvent();
  lastAction.value = `Generated ${count} events`;
}

function randomizeProgress() {
  for (const evt of events.value) {
    if (!evt.isMilestone) evt.progress = Math.floor(Math.random() * 101);
  }
  lastAction.value = "Randomized progress";
}

function clearAllDependencies() {
  for (const evt of events.value) evt.dependencies = [];
  lastAction.value = "Cleared all dependencies";
}

function clearAllEvents() {
  events.value = [];
  lastAction.value = "Cleared all events";
}

function updateSelectedField(field: string, value: unknown) {
  const evt = selectedEvent.value;
  if (!evt) return;
  const idx = events.value.findIndex((e) => e.id === evt.id);
  if (idx !== -1) {
    (events.value[idx] as Record<string, unknown>)[field] = value;
  }
}

function updateSelectedMeta(field: string, value: string) {
  const evt = selectedEvent.value;
  if (!evt) return;
  const idx = events.value.findIndex((e) => e.id === evt.id);
  if (idx !== -1) {
    if (!events.value[idx].meta) events.value[idx].meta = {};
    (events.value[idx].meta as Record<string, unknown>)[field] = value;
  }
}

function updateSelectedDate(field: "start" | "end", e: Event) {
  const val = (e.target as HTMLInputElement).value;
  if (!val) return;
  updateSelectedField(field, new Date(val));
}

// ──────────── PRESETS ────────────
const presets = [
  { id: "project", label: "Software Project", description: "4-week dev project with phases" },
  { id: "sprint", label: "Sprint Board", description: "2-week sprint with daily tasks" },
  { id: "marketing", label: "Marketing Campaign", description: "3-month campaign timeline" },
  { id: "empty", label: "Empty Canvas", description: "Start from scratch" },
];

function makeDemoEvents(): GanttEvent[] {
  return [
    { id: "evt-wireframes", rowId: "wireframes", start: new Date(2024, 2, 1, 8, 0), end: new Date(2024, 2, 4, 17, 0), progress: 100, meta: { title: "Wireframes", description: "Create wireframes", class: "bg-blue-500 rounded" } },
    { id: "evt-mockups", rowId: "mockups", start: new Date(2024, 2, 4, 8, 0), end: new Date(2024, 2, 8, 17, 0), progress: 75, dependencies: ["evt-wireframes"], meta: { title: "UI Mockups", description: "High-fidelity mockups", class: "bg-blue-400 rounded" } },
    { id: "evt-design-review", rowId: "review-design", start: new Date(2024, 2, 8, 14, 0), end: new Date(2024, 2, 8, 17, 0), isMilestone: true, dependencies: ["evt-mockups"], meta: { title: "Design Review", class: "bg-yellow-500" } },
    { id: "evt-api", rowId: "api", start: new Date(2024, 2, 9, 8, 0), end: new Date(2024, 2, 18, 17, 0), progress: 40, dependencies: ["evt-design-review"], meta: { title: "API Development", description: "Build REST API", class: "bg-emerald-500 rounded" } },
    { id: "evt-frontend", rowId: "frontend", start: new Date(2024, 2, 11, 8, 0), end: new Date(2024, 2, 20, 17, 0), progress: 30, dependencies: ["evt-design-review"], meta: { title: "Frontend Build", description: "UI components", class: "bg-emerald-400 rounded" } },
    { id: "evt-api-integration", rowId: "api-integration", start: new Date(2024, 2, 18, 8, 0), end: new Date(2024, 2, 22, 17, 0), progress: 0, dependencies: ["evt-api"], meta: { title: "API Integration", class: "bg-teal-500 rounded" } },
    { id: "evt-ui-integration", rowId: "ui-integration", start: new Date(2024, 2, 20, 8, 0), end: new Date(2024, 2, 23, 17, 0), progress: 0, dependencies: ["evt-frontend"], meta: { title: "UI Integration", class: "bg-teal-400 rounded" } },
    { id: "evt-testing", rowId: "testing", start: new Date(2024, 2, 23, 8, 0), end: new Date(2024, 2, 27, 17, 0), progress: 0, dependencies: ["evt-api-integration", "evt-ui-integration"], meta: { title: "Testing", description: "QA", class: "bg-orange-500 rounded" } },
    { id: "evt-bugfix", rowId: "bugfix", start: new Date(2024, 2, 25, 8, 0), end: new Date(2024, 2, 29, 17, 0), progress: 0, dependencies: ["evt-testing"], meta: { title: "Bug Fixes", class: "bg-orange-400 rounded" } },
    { id: "evt-deploy", rowId: "deploy", start: new Date(2024, 2, 29, 8, 0), end: new Date(2024, 2, 30, 17, 0), progress: 0, dependencies: ["evt-bugfix"], meta: { title: "Deployment", class: "bg-purple-500 rounded" } },
    { id: "evt-launch", rowId: "deploy", start: new Date(2024, 2, 30, 17, 0), end: new Date(2024, 2, 30, 17, 0), isMilestone: true, dependencies: ["evt-deploy"], meta: { title: "Launch!", class: "bg-red-500" } },
    { id: "evt-monitoring", rowId: "monitoring", start: new Date(2024, 2, 30, 8, 0), end: new Date(2024, 3, 1, 0, 0), progress: 0, dependencies: ["evt-deploy"], meta: { title: "Monitoring", class: "bg-purple-400 rounded" } },
  ];
}

function resetToDemo() {
  loadPreset("project");
}

function loadPreset(id: string) {
  eventCounter = 0;
  switch (id) {
    case "project":
      projectStart.value = new Date(2024, 2, 1, 0, 0);
      projectEnd.value = new Date(2024, 3, 1, 0, 0);
      options.scale = 24;
      options.cellWidth = 80;
      headers.value = ["Task", "Owner"];
      rows.length = 0;
      rows.push(
        { id: "design", label: "Design Phase", children: [{ id: "wireframes", columns: ["Wireframes", "Alice"] }, { id: "mockups", columns: ["UI Mockups", "Alice"] }, { id: "review-design", columns: ["Design Review", "Team"] }] },
        { id: "development", label: "Development Phase", children: [{ id: "api", columns: ["API Development", "Bob"] }, { id: "frontend", columns: ["Frontend Build", "Carol"] }, { id: "integration", label: "Integration", children: [{ id: "api-integration", columns: ["API Integration", "Bob"] }, { id: "ui-integration", columns: ["UI Integration", "Carol"] }] }] },
        { id: "qa", label: "QA Phase", children: [{ id: "testing", columns: ["Testing", "Dave"] }, { id: "bugfix", columns: ["Bug Fixes", "Bob & Carol"] }] },
        { id: "launch", label: "Launch", children: [{ id: "deploy", columns: ["Deployment", "DevOps"] }, { id: "monitoring", columns: ["Monitoring", "Team"] }] },
      );
      events.value = makeDemoEvents();
      break;

    case "sprint": {
      projectStart.value = new Date(2024, 2, 11, 0, 0);
      projectEnd.value = new Date(2024, 2, 25, 0, 0);
      options.scale = 12;
      options.cellWidth = 60;
      headers.value = ["Task", "Points"];
      rows.length = 0;
      const devs = ["Alice", "Bob", "Carol", "Dave"];
      rows.push({ id: "backlog", label: "Backlog", children: devs.map((d) => ({ id: d.toLowerCase(), columns: [d, String(Math.floor(Math.random() * 8) + 3)] })) });
      rows.push({ id: "review", label: "Review", children: [{ id: "code-review", columns: ["Code Review", "5"] }, { id: "qa-review", columns: ["QA Review", "3"] }] });
      events.value = [];
      const sprintColors = ["bg-blue-500 rounded", "bg-emerald-500 rounded", "bg-orange-500 rounded", "bg-purple-500 rounded"];
      devs.forEach((d, di) => {
        for (let t = 0; t < 3; t++) {
          const dayStart = di * 2 + t + 1;
          events.value.push({
            id: `sprint-${d}-${t}`,
            rowId: d.toLowerCase(),
            start: new Date(2024, 2, 11 + dayStart, 8, 0),
            end: new Date(2024, 2, 11 + dayStart + 1 + Math.floor(Math.random() * 2), 17, 0),
            progress: Math.floor(Math.random() * 100),
            meta: { title: `${d} Task ${t + 1}`, description: `Sprint task`, class: sprintColors[(di + t) % sprintColors.length] },
          });
        }
      });
      events.value.push({ id: "sprint-end", rowId: "qa-review", start: new Date(2024, 2, 22, 17, 0), end: new Date(2024, 2, 22, 17, 0), isMilestone: true, meta: { title: "Sprint End", class: "bg-red-500" } });
      break;
    }

    case "marketing": {
      projectStart.value = new Date(2024, 0, 1, 0, 0);
      projectEnd.value = new Date(2024, 3, 1, 0, 0);
      options.scale = 168;
      options.cellWidth = 100;
      headers.value = ["Campaign", "Lead"];
      topLevel.value = "months";
      rows.length = 0;
      rows.push(
        { id: "planning", label: "Planning", children: [{ id: "research", columns: ["Market Research", "Jane"] }, { id: "strategy", columns: ["Strategy", "Mike"] }] },
        { id: "content", label: "Content", children: [{ id: "blog", columns: ["Blog Posts", "Sara"] }, { id: "video", columns: ["Video Content", "Tom"] }, { id: "social", columns: ["Social Media", "Lisa"] }] },
        { id: "execution", label: "Execution", children: [{ id: "ads", columns: ["Paid Ads", "Mike"] }, { id: "email", columns: ["Email Blast", "Jane"] }] },
      );
      events.value = [
        { id: "mk-research", rowId: "research", start: new Date(2024, 0, 1), end: new Date(2024, 0, 21), progress: 100, meta: { title: "Market Research", class: "bg-blue-500 rounded" } },
        { id: "mk-strategy", rowId: "strategy", start: new Date(2024, 0, 15), end: new Date(2024, 1, 1), progress: 100, dependencies: ["mk-research"], meta: { title: "Strategy Doc", class: "bg-blue-400 rounded" } },
        { id: "mk-blog", rowId: "blog", start: new Date(2024, 1, 1), end: new Date(2024, 2, 15), progress: 60, dependencies: ["mk-strategy"], meta: { title: "Blog Series", class: "bg-emerald-500 rounded" } },
        { id: "mk-video", rowId: "video", start: new Date(2024, 1, 10), end: new Date(2024, 2, 1), progress: 40, dependencies: ["mk-strategy"], meta: { title: "Promo Videos", class: "bg-pink-500 rounded" } },
        { id: "mk-social", rowId: "social", start: new Date(2024, 1, 15), end: new Date(2024, 3, 1), progress: 20, meta: { title: "Social Campaign", class: "bg-purple-500 rounded" } },
        { id: "mk-ads", rowId: "ads", start: new Date(2024, 2, 1), end: new Date(2024, 3, 1), progress: 0, dependencies: ["mk-video"], meta: { title: "Paid Ads", class: "bg-orange-500 rounded" } },
        { id: "mk-email", rowId: "email", start: new Date(2024, 2, 15), end: new Date(2024, 2, 20), progress: 0, dependencies: ["mk-blog"], meta: { title: "Email Campaign", class: "bg-teal-500 rounded" } },
        { id: "mk-launch", rowId: "ads", start: new Date(2024, 2, 1), end: new Date(2024, 2, 1), isMilestone: true, meta: { title: "Campaign Launch", class: "bg-red-500" } },
      ];
      break;
    }

    case "empty":
      projectStart.value = new Date();
      projectStart.value.setHours(0, 0, 0, 0);
      projectEnd.value = new Date(projectStart.value.getTime() + 30 * 86400000);
      options.scale = 24;
      options.cellWidth = 80;
      headers.value = ["Task", "Owner"];
      rows.length = 0;
      rows.push({ id: "default", label: "Tasks", children: [{ id: "task-1", columns: ["Task 1", "Unassigned"] }] });
      events.value = [];
      break;
  }
  lastAction.value = `Loaded preset: ${id}`;
}

// ──────────── EVENT HANDLERS ────────────
function onEventClick(payload: EventClickPayload) {
  lastAction.value = `Selected: ${payload.event.meta?.title ?? payload.event.id}`;
}

function onDragEnd(payload: EventDragPayload) {
  const idx = events.value.findIndex((e) => e.id === payload.event.id);
  if (idx !== -1) events.value[idx] = { ...events.value[idx], ...payload.event };
  lastAction.value = `Moved: ${payload.event.meta?.title ?? payload.event.id}`;
}

function onResizeEnd(payload: EventResizePayload) {
  const idx = events.value.findIndex((e) => e.id === payload.event.id);
  if (idx !== -1) events.value[idx] = { ...events.value[idx], ...payload.event };
  lastAction.value = `Resized: ${payload.event.meta?.title ?? payload.event.id} (${payload.edge})`;
}

function onCellClick(payload: CellClickPayload) {
  const color = eventColors[eventCounter % eventColors.length];
  eventCounter++;
  addEvent({
    id: `evt-click-${Date.now()}`,
    rowId: payload.rowId,
    start: new Date(payload.date),
    end: new Date(payload.date.getTime() + 24 * 3600000),
    progress: 0,
    meta: { title: `New Task #${eventCounter}`, description: "Click-created", class: color },
  });
}

function onGroupToggle(groupId: string, collapsed: boolean) {
  lastAction.value = `${collapsed ? "Collapsed" : "Expanded"}: ${groupId}`;
}

function onScaleChange(newScale: number) {
  lastAction.value = `Scale: ${newScale}h`;
}

function onEventSelect(eventId: string | null) {
  if (!eventId) lastAction.value = "Deselected";
}

function onEventDelete(event: GanttEvent) {
  removeEvent(event.id);
}

// ──────────── INIT ────────────
events.value = makeDemoEvents();
</script>
