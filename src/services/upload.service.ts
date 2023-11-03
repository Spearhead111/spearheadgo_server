import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as fsPromises from 'fs/promises';
const COS = require('cos-nodejs-sdk-v5');

@Injectable()
export class FileService {
  private cos: any;

  constructor(private readonly configService: ConfigService) {
    this.cos = new COS({
      SecretId: this.configService.get('COS_SECRET_ID'),
      SecretKey: this.configService.get('COS_SECRET_KEY'),
    });
  }

  /**
   *
   * @param fileStream
   * @param cosFileName
   * @returns
   */
  async uploadStreamToCOS(
    fileStream: Buffer,
    cosFileName: string,
  ): Promise<string> {
    return new Promise((resolve, reject) => {
      const params = {
        Bucket: this.configService.get('BUCKET_NAME'), // 替换为你的 COS Bucket 名称
        Region: this.configService.get('BUCKET_REGION'), // 替换为你的 COS Bucket 所在地域
        Key: cosFileName, // 文件在 COS 中的名称
        Body: fileStream, // 使用文件流上传
      };

      this.cos.putObject(params, (err, data) => {
        if (err) {
          reject(err);
        } else {
          const location = data.Location;
          const imgUrl =
            this.configService.get('BUCKET_DOMAIN') +
            location.split('/').slice(1).join('/');
          resolve(imgUrl); // 返回上传后的图片路径
        }
      });
    });
  }
}
