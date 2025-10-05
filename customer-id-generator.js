/**
 * @name Customer ID Generator
 * @description
 * This script is for the "Purchaser Information" app.
 * When a new record is successfully created, it takes the record number,
 * formats it with a prefix and zero-padding, and updates the "purchaser_id" field.
 *
 * @trigger app.record.create.submit.success on the "Purchaser Information" app.
 */
(function() {
  'use strict';

  // ===================================================================================
  // 設定箇所 (User Configuration)
  // ===================================================================================
  // ★要設定: 顧客IDを保存するフィールドのフィールドコード
  const CUSTOMER_ID_FIELD = 'purchaser_id';

  // ★要設定: 顧客IDの接頭辞（プレフィックス）
  const ID_PREFIX = 'C-';

  // ★要設定: IDの桁数（ゼロ埋め）
  const PADDING_LENGTH = 7;
  // ===================================================================================

  kintone.events.on('app.record.create.submit.success', async (event) => {
    console.log('Customer ID Generator triggered.');
    const record = event.record;
    const recordId = event.recordId;

    // 既に顧客IDが何らかの理由で入力されている場合は、処理を中断
    if (record[CUSTOMER_ID_FIELD].value) {
      console.log('Customer ID already exists. Skipping generation.');
      return event;
    }

    try {
      // レコード番号を元に、新しい顧客IDを生成
      const newId = ID_PREFIX + String(recordId).padStart(PADDING_LENGTH, '0');
      console.log(`Generated new ID: ${newId} for Record ID: ${recordId}`);

      // このレコード自身の顧客IDフィールドを更新するためのAPIリクエストを作成
      const params = {
        app: kintone.app.getId(),
        id: recordId,
        record: {
          [CUSTOMER_ID_FIELD]: {
            value: newId
          }
        }
      };

      // レコードを更新
      await kintone.api(kintone.api.url('/k/v1/record', true), 'PUT', params);
      console.log('Successfully updated the record with the new Customer ID.');

    } catch (error) {
      console.error('Failed to update record with Customer ID.', error);
      // ここでエラーを出してしまうと画面にエラーが表示されてしまうため、ログ出力に留める
      // ユーザーは画面をリロードすれば生成されたIDを確認できる
    }

    return event;
  });

})();

