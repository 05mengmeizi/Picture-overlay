// import React, { useEffect, useState } from 'react'
// import ReactDOM from 'react-dom/client'
// import { bitable, CurrencyCode, FieldType, ICurrencyField, ICurrencyFieldMeta ,IAttachmentField } from '@lark-base-open/js-sdk';
// import { Alert, AlertProps, Button, Select } from 'antd';
// import { CURRENCY } from './const';
// import { getExchangeRate } from './exchange-api';

// ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
//   <React.StrictMode>
//     <LoadApp/>
//   </React.StrictMode>
// )

// function LoadApp() {
//   const [info, setInfo] = useState('get table name, please waiting ....'); /*提示信息 */
//   const [alertType, setAlertType] = useState<AlertProps['type']>('info'); /*提示信息类型 */
//   // const [currencyFieldMetaList, setMetaList] = useState<ICurrencyFieldMeta[]>([]) /*货币字段列表 */
//   const [currencyFieldMetaList, setMetaList] = useState<IAttachmentField[]>([]) // 附件字段列表
//   // const [selectFieldId, setSelectFieldId] = useState<string>(); /*选择的货币字段id */
//   const [selectFieldId, setSelectFieldId] = useState<string>(); //选择的附件字段id
//   // const [currency, setCurrency] = useState<CurrencyCode>(); /*选择的货币类型 */
//   const [attachmentOptions, setAttachmentOptions] = useState<any[]>([]); // 附件内容列表
//   const [selectedAttachment, setSelectedAttachment] = useState<any>(); // 选择的附件内容

//   // 获取当前激活表的字段列表和附件数据
//   useEffect(() => {
//     const fn = async () => {
//       const table = await bitable.base.getActiveTable(); /*获取当前激活的表 */
//       const tableName = await table.getName(); /*获取当前激活的表名 */
//       setInfo(`The table Name is ${tableName}`); /*设置提示信息 */
//       setAlertType('success'); /*设置提示信息类型 */
//       // const fieldMetaList = await table.getFieldMetaListByType<ICurrencyFieldMeta>(FieldType.Currency); /*获取货币字段列表 */
//       const fieldList = await table.getFieldMetaListByType<IAttachmentFieldMeta>(FieldType.Attachment); // 获取附件字段列表 这里有一点没懂 为什么获取的不是meta 然后meta配上附件格式就会报错 只能使用简略格式
//       console.log(fieldList);
//       // setMetaList(fieldMetaList); /*设置货币字段列表 */
//       setMetaList(fieldList); /*设置附件字段列表 */
//     };
//     fn();
//   }, []);
//   useEffect(() => {
//     const fetchAttachments = async () => {
//       if (!selectFieldId) return;
//       const table = await bitable.base.getActiveTable();
//       const field = await table.getField<IAttachmentField>(selectFieldId);

//       // 获取附件字段的记录数据
//       const recordIdList = await table.getRecordIdList();
//       const attachments: any[] = [];
      
//       for (const recordId of recordIdList) {
//         const attachmentsInRecord = await field.getValue(recordId); // 获取该字段在某记录中的值（附件）
//         if (attachmentsInRecord && attachmentsInRecord.length > 0) {
//           attachmentsInRecord.forEach((attachment: any) => {
//             attachments.push({
//               label: attachment.name,
//               value: attachment.id
//             });
//           });
//         }
//       }
      
//       setAttachmentOptions(attachments); // 设置附件选择列表
//     };

//     fetchAttachments();
//   }, [selectFieldId]); // 依赖于 selectFieldId，当选择的附件字段变化时重新获取附件


//   const formatFieldMetaList = (metaList: IAttachmentField[]) => {
//     return metaList.map(meta => ({ label: meta.name, value: meta.id })); /*格式化附件字段列表 */
//   };

  
//   // 处理附件选择操作
//   const handleAttachmentSelect = (value: any) => {
//     setSelectedAttachment(value); // 设置选择的附件
//     console.log('Selected Attachment:', value);
//   };
//   return (
//     <div>
//       <div style={{ margin: 10 }}>
//         <div>Select Field</div>
//         <Select
//           style={{ width: 300 }}
//           onChange={setSelectFieldId}
//           options={formatFieldMetaList(currencyFieldMetaList)}
//         />
//       </div>
//       {/* <div>{JSON.stringify(currencyFieldMetaList)}</div>  */}
//       {selectFieldId && (
//         <div style={{ margin: 10 }}>
//           <div>Select Attachment</div>
//           <Select
//             style={{ width: 300 }}
//             onChange={handleAttachmentSelect}
//             options={attachmentOptions}
//             disabled={attachmentOptions.length === 0}
//           />
//         </div>
//       )}
//     </div>
//   );
// }
import React, { useEffect, useState } from 'react'
import ReactDOM from 'react-dom/client'
import { bitable, CurrencyCode, FieldType, ICurrencyField, ICurrencyFieldMeta ,IAttachmentField, IAttachmentFieldMeta} from '@lark-base-open/js-sdk';
import { Alert, AlertProps, Button, Select } from 'antd';
import axios from 'axios';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LoadApp/>
  </React.StrictMode>
)

function LoadApp() {
  const [info, setInfo] = useState('get table name, please waiting ....'); /*提示信息 */
  const [alertType, setAlertType] = useState<'info' | 'success' | 'error'>('info'); /*提示信息类型 */
  const [currencyFieldMetaList, setMetaList] = useState<IAttachmentField[]>([]) // 附件字段列表
  const [selectFieldId, setSelectFieldId] = useState<string>(); //选择的附件字段id
  const [attachmentOptions, setAttachmentOptions] = useState<any[]>([]); // 附件内容列表
  const [selectedAttachment, setSelectedAttachment] = useState<any>(); // 选择的附件内容
  const [selectedAttachments, setSelectedAttachments] = useState<any[]>([]); // 已选择的附件列表
  const [recordValList, setRecordValList] = useState<any[]>([]); // 记录详细信息列表

  // 获取当前激活表的字段列表和附件数据
  useEffect(() => {
    const fn = async () => {
      try{  
        if (!selectFieldId) return;
        const table = await bitable.base.getActiveTable(); /*获取当前激活的表 */
        const tableName = await table.getName(); /*获取当前激活的表名 */
        setInfo(`The table Name is ${tableName}`); /*设置提示信息 */
        // console.log(info);
        setAlertType('success'); /*设置提示信息类型 */
        // console.log(alertType);
        // const fieldList = await table.getFieldMetaListByType<IAttachmentFieldMeta>(FieldType.Attachment); // 获取附件字段列表
        const fieldList = await table.getFieldMetaListByType<IAttachmentFieldMeta>(FieldType.Attachment);
        // console.log(fieldList);
        setMetaList(fieldList); /*设置附件字段列表 */

        // const { tableId, viewId } = await bitable.base.getSelection(); // 获取当前激活的视图ID
        // const recordIdList = await bitable.ui.selectRecordIdList(tableId, viewId); // 获取当前激活的视图中的记录ID列表
        // const fetchedRecordValList = [];
        // for (const recordId of recordIdList) {
        //   const record = await table.getRecordById(recordId);
        //   fetchedRecordValList.push(record); // 将记录信息推入数组
        // }
        // setRecordValList(fetchedRecordValList); // 设置记录详细信息
        // console.log(recordValList);

        }catch (error) {
        console.error("Error fetching data:", error);
        setInfo('获取数据失败，请重试。');
        setAlertType('error');
      }


    };
    fn();
  }, []);

  useEffect(() => {
    const fetchAttachments = async () => {

      const table = await bitable.base.getActiveTable();
      const field = await table.getField<IAttachmentField>(selectFieldId);

  
      // 获取记录 ID 列表
      const recordIdList = await table.getRecordIdList();
      const attachments: any[] = [];
  
      for (const recordId of recordIdList) {
        const attachmentsInRecord = await field.getValue(recordId); // 获取该字段在某记录中的值（附件）
        // console.log(attachmentsInRecord);
  
        if (attachmentsInRecord && attachmentsInRecord.length > 0) {
          const temp: string[] = [];
  
          for (const attachment of attachmentsInRecord) {
            'image/png'
            if( attachment.type === 'image/png'){
              const token = attachment.token;
              temp.push(token);
    
              // 获取附件下载链接的 Promise 数组
              const url = await table.getCellAttachmentUrls(temp, selectFieldId, recordId);
              
              // 在 url 解析完后，把结果放到 attachments 数组
              const attachmentUrl = url[0]; // 假设返回的是一个数组，取第一个 URL
    
              attachments.push({
                label: attachment.name,
                value: attachment.name,
                url: attachmentUrl,
              });
            }
          }
          // console.log(attachments);
        }
      }
  
      // 设置附件选择列表
      setAttachmentOptions(attachments);
    };
  
    fetchAttachments();
  }, [selectFieldId]); // 依赖于 selectFieldId，当选择的附件字段变化时重新获取附件


  const fetchRecordDetails = async () => {
    try {
      const ui = bitable.ui;
      const { tableId, viewId } = await bitable.base.getSelection(); // 获取当前激活的视图ID
      const recordIdList = await ui.selectRecordIdList(tableId, viewId); // 获取当前激活的视图中的记录ID列表
      const fetchedRecordValList = [];
      for (const recordId of recordIdList) {
        const record = await table.getRecordById(recordId);
        fetchedRecordValList.push(record); // 将记录信息推入数组
      }
      setRecordValList(fetchedRecordValList); // 设置记录详细信息
      console.log(recordValList);
    } catch (error) {
      console.error("Error fetching records:", error);
      setInfo('获取记录失败，请重试。');
      setAlertType('error');
    }
  };


  const formatFieldMetaList = (metaList: IAttachmentField[]) => {
    return metaList.map(meta => ({ label: meta.name, value: meta.id })); 
  };

  // 处理附件选择操作
  const handleAttachmentSelect = (value: any) => {
    // console.log('Selected Attachment:', value);
    setSelectedAttachment(value); // 设置选择的附件
  };

  // 处理已选择的附件添加操作
  const handleAddAttachment = () => {
    if (selectedAttachment && !selectedAttachments.some(att => att.value === selectedAttachment)) {
      // 查找选中的附件的 url
      const selectedAttachmentData = attachmentOptions.find(att => att.value === selectedAttachment);

      if (selectedAttachmentData) {
        setSelectedAttachments([
          ...selectedAttachments,
          {
            label: selectedAttachmentData.label,
            value: selectedAttachmentData.value,
            url: selectedAttachmentData.url, // 添加url到已选择附件
          }
        ]);
        setSelectedAttachment(null); // 重置选择框
      }
    }
  };

  const handleRemoveAttachment = (value: any) => {
    setSelectedAttachments(selectedAttachments.filter(attachment => attachment.value !== value));
  };
  // const onDragEnd = (result) => {
  //   if (!result.destination) return;
  //   const items = Array.from(selectedAttachments);
  //   const [removed] = items.splice(result.source.index, 1);
  //   items.splice(result.destination.index, 0, removed);
  //   setSelectedAttachments(items);
  // };

  const onDragStart = (e, index) => {
    e.dataTransfer.setData("draggedIndex", index);
  };

  const onDragOver = (e) => {
    e.preventDefault(); // Allow drop
  };

  const onDrop = (e, dropIndex) => {
    const draggedIndex = e.dataTransfer.getData("draggedIndex");
    const draggedItem = selectedAttachments[draggedIndex];
    
    const updatedList = [...selectedAttachments];
    updatedList.splice(draggedIndex, 1); // Remove dragged item
    updatedList.splice(dropIndex, 0, draggedItem); // Insert dragged item at drop position
    
    setSelectedAttachments(updatedList);
  };

  const handleUploadAttachments = async () => {
    if (selectedAttachments.length === 0) {
      alert('No attachments to upload.');
      return;
    }

    try {
      const attachmentUrls = [];
      for (let i = 0; i < selectedAttachments.length; i++) {
        const attachment = selectedAttachments[i];
        const url = attachment.url;  // 假设每个附件对象有一个 url 属性
        attachmentUrls.push(url);  // 将 url 添加到数组中
      }
      // console.log(attachmentUrls);
      const response = await axios.post('/your/api/upload-endpoint', attachmentUrls);

      if (response.status === 200) {
        alert('Attachments uploaded successfully.');
        // 上传成功后清空附件队列
        setSelectedAttachments([]);
      }
    } catch (error) {
      console.error('Error uploading attachments:', error);
      alert('Failed to upload attachments.');
    }
  };

  return (
    <div>
      <Button
      style={{ marginTop: 20 }}
      onClick={fetchRecordDetails}
      >
        Fetch Records
      </Button>
      <div style={{ margin: 10 }}>
        <div>Select Field</div>
        <Select
          style={{ width: 300 }}
          onChange={setSelectFieldId}
          options={formatFieldMetaList(currencyFieldMetaList)}
        />
      </div>
      {selectFieldId && (
        <div style={{ margin: 10 }}>
          <div>Select Attachment</div>
          <Select
            style={{ width: 300 }}
            value={selectedAttachment}
            onChange={handleAttachmentSelect}
            options={attachmentOptions}
            disabled={attachmentOptions.length === 0}
          />
          <Button
            style={{ marginTop: 10 }}
            onClick={handleAddAttachment}
            disabled={!selectedAttachment}
          >
            Add Attachment
          </Button>
        </div>
      )}
       {/* <div>{JSON.stringify(selectedAttachments)}</div>  */}

      {selectedAttachments.length > 0 && (
        <div
          style={{
            margin: 20,
            padding: 10,
            border: '1px solid #ccc',
            minHeight: '100px',
            position: 'relative',
          }}
        >
          {selectedAttachments.map((attachment, index) => (
            <div
              key={attachment.value}
              draggable
              onDragStart={(e) => onDragStart(e, index)}
              onDragOver={onDragOver}
              onDrop={(e) => onDrop(e, index)}
              style={{
                padding: 10,
                margin: '10px 0',
                backgroundColor: '#f0f0f0',
                cursor: 'move',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              {attachment.label}
              <button
                onClick={() => handleRemoveAttachment(attachment.value)}
                style={{ marginLeft: 10 }}
              >
                Remove
              </button>
            </div>
          ))}
        </div>
      )} 

        {/* 上传附件按钮 */}
        {selectedAttachments.length > 0 && (
        <Button
          style={{ marginTop: 20 }}
          onClick={handleUploadAttachments}
          disabled={selectedAttachments.length === 0}
        >
          Upload All Attachments
        </Button>
      )}
    </div>
  );
}






// {selectFieldId && (
//   <div style={{ margin: 10 }}>
//     <div>Select Attachment</div>
//     <Select
//       style={{ width: 300 }}
//       value={selectedAttachment}
//       onChange={handleAttachmentSelect}
//       options={attachmentOptions}
//       disabled={attachmentOptions.length === 0}
//     />
//     <Button
//       style={{ marginTop: 10 }}
//       onClick={handleAddAttachment}
//       disabled={!selectedAttachment}
//     >
//       Add Attachment
//     </Button>
//   </div>
// )}
// {selectedAttachments.length > 0 && (
//   <DragDropContext onDragEnd={onDragEnd}>
//     <Droppable droppableId="attachment">
//       {(provided) => (
//         <div
//           {...provided.droppableProps}
//           ref={provided.innerRef}
//           style={{ margin: 20, padding: 10, border: '1px solid #ccc' }}
//         >
//           {selectedAttachments.map((attachment, index) => (
//             console.log(attachment),
//             <Draggable key={attachment} draggableId={String(attachment)} index={index}>
//               {(provided) => (
//                 <div
//                   ref={provided.innerRef}
//                   {...provided.draggableProps}
//                   {...provided.dragHandleProps}
//                   style={{ padding: 10, margin: '10px 0', backgroundColor: '#f0f0f0', cursor: 'move' }}
//                 >
//                   {attachment.label}
//                   <Button
//                     type="dashed"
//                     onClick={() => handleRemoveAttachment(attachment.value)}
//                     style={{ marginLeft: 10 }}
//                   >
//                     Remove
//                   </Button>
//                   {provided.placeholder}
//                 </div>
//               )}
//             </Draggable>
//           ))}
//           {provided.placeholder}
//         </div>
//       )}
//     </Droppable>
//   </DragDropContext>
// )}



