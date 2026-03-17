import Jimp from "jimp";

/**
 * RowCropper - wycina obszary nickname + points
 */
export class RowCropper {
  /**
   * Cropuje wiersz do obszarów nickname i value
   * @param image Jimp wiersz obrazu
   * @returns { nickname: Jimp, value: Jimp }
   */
  public static cropRow(image: Jimp): { nickname: Jimp; value: Jimp } {
    const width = image.getWidth();
    const height = image.getHeight();

    const nicknameArea = image.clone().crop(Math.floor(width * 0.15), 0, Math.floor(width * 0.5), height);
    const valueArea = image.clone().crop(Math.floor(width * 0.65), 0, Math.floor(width * 0.35), height);

    return { nickname: nicknameArea, value: valueArea };
  }
}