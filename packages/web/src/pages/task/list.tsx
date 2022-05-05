import { NextPage } from "next/types";
import { ChangeEvent, useEffect, MouseEvent, useMemo } from 'react';
import { useImmerAtom } from 'jotai/immer';
import { useResetAtom } from 'jotai/utils'
import { createTaskDetailAtom, monacoEditorAtom, userInfoAtom } from '../../atoms';
import { CronTime } from '@webest/web-page-monitor-helper';
import { fetchAPI, useI18n, innerHTML, useHeadTitle, arrayToCsv, downloadBlob } from "../../helpers/index";
import Link from "next/link";
import { ScriptList } from "../../components/scriptList";
import { useRouter } from "next/router";


const TaskListSimpPage: NextPage = () => {

  const [taskDetail, setTaskDetail] = useImmerAtom(createTaskDetailAtom);
  const [userInfo, setUserInfo] = useImmerAtom(userInfoAtom);
  const resetTaskDetail = useResetAtom(createTaskDetailAtom);
  let headTitle = useHeadTitle('Task List');


  const { t, locale } = useI18n();
  const router = useRouter();

  // update input date when first entry
  async function firstInit() {
    resetTaskDetail();
    let taskList: any = [];
    // TODO pagination
    taskList = await fetchAPI(`/task?userId=${userInfo._id}`) 
    setTaskDetail((v) => {
      if(taskList.length){
        v.taskList = taskList;
      }
    });
  }

  async function handleBtnDelete(ev: MouseEvent<HTMLButtonElement> ) {
    ev.preventDefault();
    let element = ev.target;
    let rowId = (element as any).dataset.rowId;
    let confirmed = confirm(t('Are you sure to delete this script') + '?');
    if(!confirmed){
      return;
    }
    let resp = await fetchAPI(`/task?id=${rowId}`, null , 'DELETE')
    window.location.reload();
    return false;
  }

  async function handleBtnExport(ev: MouseEvent<HTMLButtonElement>) {
    ev.preventDefault();
    let element = ev.target;
    let rowId = (element as any).dataset.rowId;
    let confirmed = confirm(t('You can only export recent 1000 checks of one task') + ', \n'
    + t('And export once per hour per task') + '. \n'
    + t('Are you sure to export history of this task') + '?' + '\n'
    + t(`Notice: Export history may only works on Chrome browser.`) + '\n'
    );
    if(!confirmed){
      return;
    }
    try {
      let resp = await fetchAPI(`/task/export?taskId=${rowId}`, null , 'GET');
      console.log(resp)
      if(resp && Array.isArray(resp) && resp.length && resp.length > 0){
        downloadBlob(arrayToCsv(resp), `export-${Date.now()}.csv`, 'text/csv;charset=utf-8;')
      }else{
        alert(t('No data to export, please try again 1 hour later'));
      }
    } catch (error) {
      console.error(error)
    }
  }

  useEffect(() => {
    firstInit();
  }, [router.query]);

  let meColumns = useMemo(() => [
    {
      Header: t('alias'),
      accessor: 'extra.alias',
    },
    {
      Header: t('URL'),
      id: 'pageURL',
      Cell: ({ row: {original: or} }) => {
        return (
          <>
            { or.pageURL ? or.pageURL : ( or.mode === 'custom' ? t('Custom Task Script') : '') }
          </>
        )
      }
    },
    {
      Header: t('Edit / Delete'),
      id: 'editOrView',
      Cell: ({ row: {original: or} }) => {
        return (<div style={{
          display: 'flex',
        }}>
          <Link prefetch={false} href={( or.mode === 'simp' ? '/task/edit_simp?id=' : '/task/edit_custom?id=') + or._id}>
            <a className='btn'>{t(`Edit`)}</a>
          </Link>
        <button data-row-id={or._id} onClick={handleBtnDelete} style={{marginLeft: '10px'}}>
            {t(`Delete`)}
          </button>
          {
            // or.mode === 'simp' ? 
            (
              <button data-row-id={or._id} onClick={handleBtnExport} style={{marginLeft: '10px'}}>
                {t(`Export`)}
              </button>
            ) 
            // : null
          }
        </div>
        )
      }
    },
  ],[locale]);

  return (<>
    {headTitle}
    <main>
      <div>
        <Link prefetch={false} href="/login">
          <a>{t('Back to User Center')}</a>
        </Link>
        &nbsp;&nbsp;
        {
          (taskDetail?.taskList?.length && taskDetail?.taskList?.length < 5 ) ? (
            <>
              <Link prefetch={false} href={'/task/edit_simp'}>
                <a>{t(`Create a task in Simple Mode`)}</a>
              </Link>&nbsp;&nbsp;&nbsp;&nbsp;
            </>
          ) : null
        }
      </div>
      <h3>
        {t(`Tasks created by you`)} :
      </h3>
      <ScriptList
        columns={meColumns}
        data={taskDetail.taskList}
      ></ScriptList>
      <div style={{zoom: 0.85}}>
        {t(`Notice: Export history may only works on Chrome browser.`)}
      </div>
    </main>
  </>);
}

export default TaskListSimpPage