import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = [
  "hsl(217, 91%, 60%)", "hsl(262, 83%, 58%)", "hsl(142, 71%, 45%)",
  "hsl(38, 92%, 50%)", "hsl(0, 84%, 60%)", "hsl(190, 90%, 50%)",
  "hsl(45, 93%, 47%)", "hsl(280, 65%, 60%)", "hsl(160, 60%, 45%)",
  "hsl(330, 80%, 55%)", "hsl(200, 80%, 50%)", "hsl(100, 60%, 50%)",
];

interface CubeData {
  cube_name: string;
  weight: number;
}

export default function CubesPieChart({ cubes }: { cubes: CubeData[] }) {
  if (!cubes?.length) return null;

  const data = cubes.map((c) => ({ name: c.cube_name, value: c.weight }));

  return (
    <div className="w-24 h-24">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie data={data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={40} innerRadius={15}>
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value: number, name: string) => [`${value}%`, name]}
            contentStyle={{ direction: "rtl", fontSize: "12px" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
