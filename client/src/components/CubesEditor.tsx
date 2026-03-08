import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, X } from "lucide-react";
import { strings } from "@/constants/strings";

interface CubeEntry {
  cube_id: string;
  cube_name: string;
  weight: number;
}

interface Props {
  cubes: CubeEntry[];
  availableCubes: { cube_id: string; name: string }[];
  topX: number;
  weightThreshold: number;
  onChange: (cubes: CubeEntry[]) => void;
  onTopXChange: (v: number) => void;
  onWeightThresholdChange: (v: number) => void;
}

export default function CubesEditor({ cubes, availableCubes, topX, weightThreshold, onChange, onTopXChange, onWeightThresholdChange }: Props) {
  const [selectedCubeToAdd, setSelectedCubeToAdd] = useState("");

  const addCube = () => {
    if (!selectedCubeToAdd) return;
    const cube = availableCubes.find((c) => c.cube_id === selectedCubeToAdd);
    if (!cube || cubes.find((c) => c.cube_id === cube.cube_id)) return;
    onChange([...cubes, { cube_id: cube.cube_id, cube_name: cube.name, weight: 0 }]);
    setSelectedCubeToAdd("");
  };

  const removeCube = (cubeId: string) => onChange(cubes.filter((c) => c.cube_id !== cubeId));

  const setCubeWeight = (cubeId: string, weight: number) => {
    onChange(cubes.map((c) => (c.cube_id === cubeId ? { ...c, weight } : c)));
  };

  const distributeEvenly = () => {
    if (cubes.length === 0) return;
    const w = Math.floor(100 / cubes.length);
    const remainder = 100 - w * cubes.length;
    onChange(cubes.map((c, i) => ({ ...c, weight: w + (i === 0 ? remainder : 0) })));
  };

  const totalWeight = cubes.reduce((s, c) => s + c.weight, 0);
  const unusedCubes = availableCubes.filter((c) => !cubes.find((fc) => fc.cube_id === c.cube_id));

  return (
    <div className="space-y-4 rounded-lg border p-4">
      <div className="flex items-end gap-2">
        <div className="flex-1">
          <Label className="mb-1 block">{strings.tagEditor.addCube}</Label>
          <Select value={selectedCubeToAdd} onValueChange={setSelectedCubeToAdd}>
            <SelectTrigger><SelectValue placeholder={strings.tagEditor.selectCube} /></SelectTrigger>
            <SelectContent>
              {unusedCubes.map((c) => <SelectItem key={c.cube_id} value={c.cube_id}>{c.name}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline" size="icon" onClick={addCube} disabled={!selectedCubeToAdd}>
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {cubes.length > 0 && (
        <>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">
              {strings.tagEditor.totalWeight} <span className={Math.abs(totalWeight - 100) > 0.5 ? "text-destructive" : "text-success"}>{totalWeight}%</span>
            </span>
            <Button variant="ghost" size="sm" onClick={distributeEvenly}>{strings.tagEditor.distributeEvenly}</Button>
          </div>
          <div className="space-y-3">
            {cubes.map((cube) => (
              <CubeWeightRow key={cube.cube_id} cube={cube} onRemove={removeCube} onWeightChange={setCubeWeight} />
            ))}
          </div>
        </>
      )}

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>{strings.tagEditor.topX}</Label>
          <Input type="number" value={topX} onChange={(e) => onTopXChange(Number(e.target.value))} min={1} />
        </div>
        <div className="space-y-2">
          <Label>{strings.tagEditor.weightThreshold}</Label>
          <Input type="number" value={weightThreshold} onChange={(e) => onWeightThresholdChange(Number(e.target.value))} min={0} max={100} />
        </div>
      </div>
    </div>
  );
}

function CubeWeightRow({ cube, onRemove, onWeightChange }: { cube: { cube_id: string; cube_name: string; weight: number }; onRemove: (id: string) => void; onWeightChange: (id: string, w: number) => void }) {
  return (
    <div className="flex items-center gap-3 rounded-md border p-3 bg-secondary/30">
      <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => onRemove(cube.cube_id)}>
        <X className="h-3 w-3" />
      </Button>
      <Badge variant="secondary" className="shrink-0">{cube.cube_name}</Badge>
      <div className="flex-1">
        <Slider value={[cube.weight]} onValueChange={([v]) => onWeightChange(cube.cube_id, v)} max={100} step={1} />
      </div>
      <Input
        type="number"
        value={cube.weight}
        onChange={(e) => onWeightChange(cube.cube_id, Math.min(100, Math.max(0, Number(e.target.value))))}
        className="w-16 text-center"
        min={0}
        max={100}
      />
      <span className="text-sm text-muted-foreground">{strings.common.percent}</span>
    </div>
  );
}
