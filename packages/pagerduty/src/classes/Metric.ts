export default class Metric {
  name: string;
  timestamp: number;
  success: boolean;
  description?: string;

  constructor(name: string, timestamp: number, sucess: boolean, description?: string) {
    this.name = name;
    this.timestamp = timestamp;
    this.success = sucess;
    this.description = description;
  }
  getMetric(): { metric: string; points: [[number, number]] } {
    return {
      metric: this.name,
      points: [[this.timestamp, Number(!this.success)]],
    };
  }
}
