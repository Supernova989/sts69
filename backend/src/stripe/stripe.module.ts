import { Module } from '@nestjs/common';
import { GoogleCloudPlatformModule } from '../gcp/gcp.module';
import { StripeService } from './stripe.service';

@Module({
  imports: [GoogleCloudPlatformModule],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
