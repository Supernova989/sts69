import { Module } from '@nestjs/common';
import { GoogleCloudPlatformModule } from '../gcp/gcp.module';
import { StripeService } from './stripe.service';

@Module({
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
