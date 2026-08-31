import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class HealthController {
  @Get()
  health(): { status: string; uptimeSec: number } {
    return { status: 'ok', uptimeSec: Math.round(process.uptime()) };
  }
}
