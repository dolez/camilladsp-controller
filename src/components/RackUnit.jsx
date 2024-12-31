import { Card, CardHeader, CardContent } from "../components/ui/Card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/Tabs";
import { NodeHeader } from "./NodeHeader";
import { MonitoringPanel } from "./MonitoringPanel";
import { DevicePanel } from "./DevicePanel";
import { ConfigPanel } from "./ConfigPanel";
import { VolumePanel } from "./VolumePanel";
// Main control components
export function RackUnit({ node }) {
  return (
    <Card className="bg-zinc-900 border-zinc-700">
      <CardHeader className="bg-zinc-800 rounded-t-lg">
        <NodeHeader node={node} />
      </CardHeader>
      <CardContent className="p-0">
        <Tabs defaultValue="monitor" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monitor">Monitor</TabsTrigger>
            <TabsTrigger value="volume">Volume</TabsTrigger>
            <TabsTrigger value="config">Config</TabsTrigger>
            <TabsTrigger value="device">Device</TabsTrigger>
          </TabsList>
          <TabsContent value="monitor" className="p-4">
            <MonitoringPanel node={node} />
          </TabsContent>
          <TabsContent value="volume" className="p-4">
            <VolumePanel node={node} />
          </TabsContent>
          <TabsContent value="config" className="p-4">
            <ConfigPanel node={node} />
          </TabsContent>
          <TabsContent value="device" className="p-4">
            <DevicePanel node={node} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
