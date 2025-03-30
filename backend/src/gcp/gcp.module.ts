import { Module } from '@nestjs/common';
import { GoogleCloudTaskService } from './task.service';

@Module({
  providers: [GoogleCloudTaskService],
  exports: [GoogleCloudTaskService],
})
export class GoogleCloudPlatformModule {}
