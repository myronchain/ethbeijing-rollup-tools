import { makeStyles } from '@material-ui/core/styles'

export const useAmountSelectorCardStyles = makeStyles(theme => ({
  root: {
    maxWidth: '45rem',
    boxSizing: 'border-box',
    [theme.breakpoints.down('xs')]: {
      width: '100%',
    },
    boxShadow: theme.boxShadow.inner,
    transition: 'all 0.15s ease-out',
  },
  topRow: {
    marginBottom: '1rem',
  },
  networkSelectionBox: {
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.15s ease-out',
  },
  networkLabel: {
    display: 'flex',
    flexDirection: 'row',
    marginLeft: '0.4rem',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  networkIconContainer: {
    display: 'flex',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
  },
  networkIcon: {
    display: 'flex',
    height: '1.5rem',
    margin: '0.7rem',
  },
  balance: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
  },
  maxButton: {
    border: 'none',
    backgroundColor: 'rgba(0, 150, 136, 0.2)',
    color: theme.palette.primary.main,
    borderRadius: '1rem',
    padding: '0.5rem 1rem',
    fontSize: '1.2rem',
    marginRight: '1rem',
    cursor: 'pointer',
    fontFamily: 'Nunito',
    fontWeight: 'bold',
  },
  container: {
    flexWrap: 'nowrap',
  },
  networkContainer: {},
  inputContainer: {},
}))
