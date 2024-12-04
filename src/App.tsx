import  { useEffect, useState } from 'react'
import React from 'react';
import './App.css'; // 引入 CSS 文件
import { DownOutlined } from '@ant-design/icons';
import { bitable, FieldType , IAttachmentFieldMeta} from '@lark-base-open/js-sdk';
import { Button, Dropdown, Space , Tag} from 'antd';
import { useDrag, useDrop } from 'react-dnd';
// import DraggableTagList from './DraggableTagList';
// import axios from 'axios';

function App() {
  const [info, setInfo] = useState('get table name, please waiting ....'); /*提示信息 */
  const [alertType, setAlertType] = useState<'info' | 'success' | 'error'>('info'); /*提示信息类型 */

  const [recordValList, setRecordValList] = useState<any[]>([]); // 记录信息列表
  const [attachmentFieldIds, setAttachmentFieldIds] = useState<string[]>([]); // 附件字段ID列表
  const [imageNames, setImageNames] = useState<string[]>([]); // 图片名称列表
  const [selectedTags, setSelectedTags] = useState<string[]>([]);


  useEffect(() => {
    const fn = async () => {
      try {
        const table = await bitable.base.getActiveTable(); // 获取当前激活的表
        const tableName = await table.getName(); // 获取当前激活的表名
        setInfo(`The table Name is ${tableName}`); // 设置提示信息
        setAlertType('success'); // 设置提示信息类型

        const fieldList = await table.getFieldMetaListByType<IAttachmentFieldMeta>(FieldType.Attachment); // 获取附件字段列表
        const attachmentFieldIds = fieldList.map(field => field.id); // 映射出附件字段的ID列表
        setAttachmentFieldIds(attachmentFieldIds); // 设置附件字段ID列表
      } catch (error) {
        console.error("Error fetching data:", error);
        setInfo('获取数据失败，请重试。');
        setAlertType('error');
      }
    };
    fn();
  }, []);


  const getImageNamesFromAttachmentFields = (attachmentsWithUrls) => {
    // 返回包含附件名称、ID 和 URL 的信息
    return attachmentsWithUrls.map((attachment) => ({
      name: attachment.name, // 附件名称
      id: attachment.id,     // 附件 ID
      // url: attachment.url    // 附件 URL
    }));
  };
  
  // 在 useEffect 中更新 setImageNames
  useEffect(() => {
    if (recordValList.length > 0) {
      const mainProcess = async (recordValList) => {
        // 先获取过滤后的附件列表，并带上 URL 信息
        const res = getAttachmentFields(recordValList)
        // console.log('res', res);
        const filteredAttachmentsWithUrls = await getFilteredAttachmentsWithUrls(res);

        // 将结果传递给 getImageNamesFromAttachmentFields，获取名称和 URL
        const imageNamesList = getImageNamesFromAttachmentFields(filteredAttachmentsWithUrls);
        console.log('imageNamesList', imageNamesList);
        // 去重处理
        const uniqueImageNames = imageNamesList.flat().filter((item, index, self) => 
          self.findIndex((i) => i.name === item.name && i.id === item.id) === index
        );
        // console.log('uniqueImageNames', uniqueImageNames);
        // 返回去重后的结果
        return uniqueImageNames;
      };

      // 调用 mainProcess 并设置图片名称
      const fetchData = async () => {
        const uniqueImageNames = await mainProcess(recordValList);
        setImageNames(uniqueImageNames); // 设置图片名称列表
      };

      fetchData(); // 执行异步操作

    }
  }, [recordValList, attachmentFieldIds]); // 依赖于 recordValList 和 attachmentFieldIds

  const getAttachmentFields = (records) => {
    return records.map(record => {
      // 筛选非空字段
      const nonEmptyFields = Object.keys(record.fields)
        .filter(key => record.fields[key] !== null && record.fields[key] !== undefined)
        .reduce((obj, key) => {
          const field = record.fields[key];
          if (attachmentFieldIds.includes(key)) {
            obj[key] = field;
          }
          return obj;
        }, {});
      return nonEmptyFields;
    });
  };

  const getFilteredAttachmentsWithUrls = async (recordList) => {
    const table = await bitable.base.getActiveTable();
    // console.log('Record List:', recordList);
  
    // 使用 flatMap 展平每个对象中的附件数组
    const filteredAttachments = recordList.flatMap(record => {
      // 假设每个记录中包含附件数组，过滤符合类型的附件
      return Object.keys(record)
        .filter(key => {
          const value = record[key];
          return Array.isArray(value) && value.some(attachment => attachment.type === 'image/png' || attachment.type === 'image/jpeg');
        })
        .map(key => record[key])
        .flat()  // 展开每个字段中的数组
        .filter(attachment => attachment.type === 'image/png' || attachment.type === 'image/jpeg');
    });
  
    console.log('Filtered Attachments:', filteredAttachments);
  
    if (filteredAttachments.length === 0) {
      console.warn('No valid image attachments found');
    }
  
    // 获取每个附件的 URL，并将其与附件信息一起返回
    const attachmentsWithUrls = await Promise.all(filteredAttachments.map(async (attachment) => {
      // console.log('Attachment:', attachment);
      // console.log('Attachment Token:', attachment.token);
      // console.log('Attachment Permission:', attachment.permission.fieldId);
      // console.log('Attachment Record ID:', attachment.permission.recordId);
      const tokens = [attachment.token]; // 确保 token 是一个字符串数组
      const url = await table.getCellAttachmentUrls(tokens, attachment.permission.fieldId, attachment.permission.recordId); // 注意token的格式必须是string[]
      console.log('Attachment URL:', url[0]);
      return {
        name: attachment.name,  // 保留附件名称
        id: url[0],   // 保留附件的 token 作为 ID 注意url是一个数组
      };
    }));
    console.log('Attachments with URLs:', attachmentsWithUrls);
    return attachmentsWithUrls;
  };

  const fetchRecordDetails = async () => {
    try {
      const table = await bitable.base.getActiveTable(); /*获取当前激活的表 */
      const tableName = await table.getName(); /*获取当前激活的表名 */
      setInfo(`The table Name is ${tableName}`); /*设置提示信息 */
      const { tableId, viewId } = await bitable.base.getSelection(); // 获取当前激活的视图ID
      
      const recordIdList = await bitable.ui.selectRecordIdList(tableId, viewId); // 获取当前激活的视图中的记录ID列表
      const fetchedRecordValList = [];
      for (const recordId of recordIdList) {
        const record = await table.getRecordById(recordId);
        fetchedRecordValList.push(record); // 将记录信息推入数组
      }
      // console.log(fetchedRecordValList);
      setRecordValList(fetchedRecordValList); // 设置记录详细信息
      // console.log(recordValList); 异步 不能立刻更新值

    } catch (error) {
      console.error("Error fetching records:", error);
      setInfo('获取记录失败，请重试。');
      setAlertType('error');
    }
  };

  // 以下是实现下拉菜单的

  const items = imageNames.map(image => ({
    key: image.id,  // 使用 id 作为唯一标识符
    label: image.name,  // 显示 name 字段
    onClick: () => handleSelectTag(image.name), // 当选择项时调用 handleSelectTag 函数
  }));


  //以下是实现tag添加与删除的


  const handleSelectTag = (name: string) => {
    if (!selectedTags.includes(name)) {
      setSelectedTags((prevTags) => [...prevTags, name]);
    }
  };

  const handleRemoveTag = (removedTag: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== removedTag));
  };


  // 以下是实现tag拖动的

  // 处理拖拽开始
  const handleDragStart = (e: React.DragEvent, tag: string) => {
    e.dataTransfer.setData('text/plain', tag); // 存储被拖拽的标签
  };

  // 处理拖拽结束
  const handleDragEnd = (e: React.DragEvent) => {
    e.preventDefault();
  };

  // 处理拖拽放置
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    const droppedTag = e.dataTransfer.getData('text/plain'); // 获取被拖拽的标签
    const currentIndex = selectedTags.indexOf(droppedTag); // 查找标签当前的位置

    if (currentIndex !== -1 && currentIndex !== dropIndex) {
      const newSelectedTags = [...selectedTags];
      newSelectedTags.splice(currentIndex, 1); // 移除当前标签
      newSelectedTags.splice(dropIndex, 0, droppedTag); // 插入到目标位置
      setSelectedTags(newSelectedTags); // 更新标签顺序
    }
  };

  // 处理拖拽目标区域
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // 阻止默认行为，允许放置
  };

  
  // 以下是发送数据到后端的部分

  const findImageIdsByTags = (tags) => {
    console.log("tags",tags);
    console.log("imageNames",imageNames);
    return imageNames.filter(image => tags.includes(image.name)).map(image => image.id);
  };


  const sendIdsToBackend = (url) => {
    fetch('http://127.0.0.1:8000/views/fold/test/', { // 替换为你的后端接口地址
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
    })
    .then(response => response.json())
    .then(data => {
      console.log('Success:', data);
    })
    .catch((error) => {
      console.error('Error:', error);
    });
  };

  const handleSendIds = () => {
    console.log("sendIds",selectedTags);
    const url = findImageIdsByTags(selectedTags);
    console.log(url);
    sendIdsToBackend(url);
  };

  return (
    <>
      <div className="app-container">
        {/* <div>{JSON.stringify(selectedTags)}</div>  */}
        <Button
        style={{ marginTop: 20 }}
        onClick={fetchRecordDetails}
        >
          选择行
        </Button>
        {/* <div>
          {recordValList.length > 0 && JSON.stringify(getAttachmentFields(recordValList))}
        </div> */}
        <div className="main">
        <div className="tag-container">
          {selectedTags.map((tag, index) => (
            <div
              key={tag}
              className="tag"
              draggable
              onDragStart={(e) => handleDragStart(e, tag)} // 拖拽开始
              onDragOver={handleDragOver} // 防止默认行为
              onDrop={(e) => handleDrop(e, index)} // 放置事件
              style={{
                marginBottom: '8px',
                cursor: 'move',
                borderRadius: '4px',
              }}
            >
              <Tag closable onClose={() => handleRemoveTag(tag)} color="blue">
                {tag}
              </Tag>
            </div>
            ))}
        </div>
        <Dropdown menu={{ items }}>
          <a onClick={(e) => e.preventDefault()} className="dropdown">
            <Space>
              
              <DownOutlined className="dropdown-icon"/>
            </Space>
          </a>
        </Dropdown>
        </div>
        <Button
          style={{ marginTop: 20 }}
          onClick={handleSendIds}
          >
          发送
        </Button>
      </div>

    </>
  )
}

export default App


