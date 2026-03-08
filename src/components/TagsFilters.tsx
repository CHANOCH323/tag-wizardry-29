import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Search, Filter, X, CalendarIcon } from "lucide-react";
import { format } from "date-fns";
import { strings } from "@/constants/strings";
import { fetchCubes, fetchAllProfiles } from "@/services/api";
import type { CubeDto, ProfileListItemDto } from "@/services/api.types";

export interface TagFilters {
  questionSearch: string;
  answerSearch: string;
  cubeName: string;
  userId: string;
  dateFrom: Date | undefined;
  dateTo: Date | undefined;
  isDraft: string;
  answerType: string;
}

const emptyFilters: TagFilters = {
  questionSearch: "",
  answerSearch: "",
  cubeName: "",
  userId: "",
  dateFrom: undefined,
  dateTo: undefined,
  isDraft: "",
  answerType: "",
};

interface Props {
  filters: TagFilters;
  onChange: (f: TagFilters) => void;
}

export default function TagsFilters({ filters, onChange }: Props) {
  const [showFilters, setShowFilters] = useState(false);
  const [cubes, setCubes] = useState<CubeDto[]>([]);
  const [users, setUsers] = useState<ProfileListItemDto[]>([]);

  useEffect(() => {
    fetchCubes().then(setCubes).catch(() => {});
    fetchAllProfiles().then(setUsers).catch(() => {});
  }, []);

  const update = (key: keyof TagFilters, value: any) => onChange({ ...filters, [key]: value });
  const hasFilters = Object.values(filters).some((v) => v !== "" && v !== undefined);

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={strings.filters.searchByQuestion}
            value={filters.questionSearch}
            onChange={(e) => update("questionSearch", e.target.value)}
            className="pr-10"
          />
        </div>
        <div className="relative min-w-[200px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={strings.filters.searchByAnswer}
            value={filters.answerSearch}
            onChange={(e) => update("answerSearch", e.target.value)}
            className="pr-10"
          />
        </div>
        <Button variant={showFilters ? "secondary" : "outline"} onClick={() => setShowFilters(!showFilters)} className="gap-2">
          <Filter className="h-4 w-4" />
          {strings.filters.filters}
        </Button>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={() => onChange(emptyFilters)} className="gap-1 text-destructive">
            <X className="h-3 w-3" />
            {strings.filters.clearAll}
          </Button>
        )}
      </div>

      {showFilters && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 p-4 rounded-lg bg-card border">
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{strings.filters.cubeName}</label>
            <Select value={filters.cubeName} onValueChange={(v) => update("cubeName", v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder={strings.common.all} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{strings.common.all}</SelectItem>
                {cubes.map((c) => <SelectItem key={c.cube_id} value={c.name}>{c.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{strings.filters.user}</label>
            <Select value={filters.userId} onValueChange={(v) => update("userId", v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder={strings.common.all} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{strings.common.all}</SelectItem>
                {users.map((u) => <SelectItem key={u.user_id} value={u.user_id}>{u.display_name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{strings.tags.answerType}</label>
            <Select value={filters.answerType} onValueChange={(v) => update("answerType", v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder={strings.common.all} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{strings.common.all}</SelectItem>
                <SelectItem value="cubes">{strings.tags.cubes}</SelectItem>
                <SelectItem value="free_text">{strings.tags.freeText}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{strings.tags.draft}</label>
            <Select value={filters.isDraft} onValueChange={(v) => update("isDraft", v === "all" ? "" : v)}>
              <SelectTrigger><SelectValue placeholder={strings.common.all} /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{strings.common.all}</SelectItem>
                <SelectItem value="true">{strings.common.yes}</SelectItem>
                <SelectItem value="false">{strings.common.no}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-xs font-medium text-muted-foreground mb-1 block">{strings.filters.fromDate}</label>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-full justify-start text-right gap-2 font-normal">
                  <CalendarIcon className="h-4 w-4" />
                  {filters.dateFrom ? format(filters.dateFrom, "dd/MM/yyyy") : strings.filters.selectDate}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={filters.dateFrom} onSelect={(d) => update("dateFrom", d)} />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      )}
    </div>
  );
}

export { emptyFilters };
